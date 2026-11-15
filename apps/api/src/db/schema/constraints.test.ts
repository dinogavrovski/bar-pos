// Each test tries to break one database rule and expects Postgres to refuse.
// Every test runs inside inRollback(), so nothing is left in the database afterwards.
import { eq } from 'drizzle-orm'
import { afterAll, describe, expect, it } from 'vitest'
import { pool } from '../client.js'
import { inRollback, pgErrorCode, seedBasics, violates } from '../../test/db.js'
import { items, payments, tabItems, tabs, users, venues } from './index.js'

// This file uses the shared pool directly (no buildApp), so close it ourselves.
afterAll(async () => {
  await pool.end()
})

describe('tab_items', () => {
  // Start with a "happy path": if this fails, the seed or schema is broken and the
  // other failures are noise.
  it('accepts a normal order', async () => {
    await inRollback(async (db) => {
      const { ana, espresso, tab } = await seedBasics(db)

      const [row] = await db
        .insert(tabItems)
        .values({ tabId: tab.id, itemId: espresso.id, person: 2, price: 8000, createdBy: ana.id })
        .returning()

      expect(row?.voidedAt).toBeNull()
      expect(row?.sentAt).toBeNull()
    })
  })

  it('rejects an order on a tab that does not exist', async () => {
    await inRollback(async (db) => {
      const { ana, espresso } = await seedBasics(db)

      const insert = db
        .insert(tabItems)
        .values({ tabId: 999_999, itemId: espresso.id, price: 8000, createdBy: ana.id })

      await expect(insert).rejects.toSatisfy(violates('tab_items_tab_id_tabs_id_fk'))
    })
  })

  // Void rule: voidedAt and voidedBy are both empty or both filled in.
  it('accepts a proper void (voidedAt AND voidedBy)', async () => {
    await inRollback(async (db) => {
      const { ana, espresso, tab } = await seedBasics(db)

      const [row] = await db
        .insert(tabItems)
        .values({
          tabId: tab.id,
          itemId: espresso.id,
          price: 8000,
          voidedAt: new Date(),
          voidedBy: ana.id,
          createdBy: ana.id,
        })
        .returning()

      expect(row?.voidedAt).not.toBeNull()
      expect(row?.voidedBy).toBe(ana.id)
    })
  })

  it('rejects a void with no user (voidedAt without voidedBy)', async () => {
    await inRollback(async (db) => {
      const { ana, espresso, tab } = await seedBasics(db)

      const insert = db.insert(tabItems).values({
        tabId: tab.id,
        itemId: espresso.id,
        price: 8000,
        voidedAt: new Date(),
        createdBy: ana.id,
      })

      await expect(insert).rejects.toSatisfy(violates('tab_items_void_complete'))
    })
  })

  it('rejects voidedBy without voidedAt', async () => {
    await inRollback(async (db) => {
      const { ana, espresso, tab } = await seedBasics(db)

      const insert = db.insert(tabItems).values({
        tabId: tab.id,
        itemId: espresso.id,
        price: 8000,
        voidedBy: ana.id,
        createdBy: ana.id,
      })

      await expect(insert).rejects.toSatisfy(violates('tab_items_void_complete'))
    })
  })

  it('rejects a price of 0 (tab_items_price_positive)', async () => {
    await inRollback(async (db) => {
      const { ana, espresso, tab } = await seedBasics(db)

      const insert = db
        .insert(tabItems)
        .values({ tabId: tab.id, itemId: espresso.id, price: 0, createdBy: ana.id })

      await expect(insert).rejects.toSatisfy(violates('tab_items_price_positive'))
    })
  })

  it('rejects a blank note (tab_items_note_not_blank)', async () => {
    await inRollback(async (db) => {
      const { ana, espresso, tab } = await seedBasics(db)

      const insert = db
        .insert(tabItems)
        .values({ tabId: tab.id, itemId: espresso.id, price: 8000, note: '   ', createdBy: ana.id })

      await expect(insert).rejects.toSatisfy(violates('tab_items_note_not_blank'))
    })
  })

  it('accepts a non-blank note (tab_items_note_not_blank)', async () => {
    await inRollback(async (db) => {
      const { ana, espresso, tab } = await seedBasics(db)

      const [row] = await db
        .insert(tabItems)
        .values({
          tabId: tab.id,
          itemId: espresso.id,
          price: 8000,
          note: 'Extra hot',
          createdBy: ana.id,
        })
        .returning()

      expect(row?.note).toBe('Extra hot')
    })
  })
  it('rejects a note that has just been opened and closed (tab_items_note_not_blank)', async () => {
    await inRollback(async (db) => {
      const { ana, espresso, tab } = await seedBasics(db)

      const insert = db.insert(tabItems).values({
        tabId: tab.id,
        itemId: espresso.id,
        price: 8000,
        note: '',
        createdBy: ana.id,
      })
      await expect(insert).rejects.toSatisfy(violates('tab_items_note_not_blank'))
    })
  })
})

describe('items', () => {
  it('rejects a station that is not in the enum', async () => {
    await inRollback(async (db) => {
      const { venue } = await seedBasics(db)

      const insert = db.insert(items).values({
        venueId: venue.id,
        name: 'Burger',
        // TypeScript already refuses 'kitchn' (it's not 'bar' | 'kitchen'), so we force it
        // through to prove the DATABASE also refuses it, e.g. for raw SQL or a buggy cast.
        station: 'kitchn' as never,
        price: 30000,
      })

      await expect(insert).rejects.toSatisfy(pgErrorCode('22P02'))
    })
  })

  it('cannot be deleted once it has been ordered (old bills keep pointing at it)', async () => {
    await inRollback(async (db) => {
      const { ana, espresso, tab } = await seedBasics(db)
      await db
        .insert(tabItems)
        .values({ tabId: tab.id, itemId: espresso.id, price: 8000, createdBy: ana.id })

      const remove = db.delete(items).where(eq(items.id, espresso.id))

      await expect(remove).rejects.toSatisfy(violates('tab_items_item_id_items_id_fk'))
    })
  })

  it('rejects a price of 0 (items_price_positive)', async () => {
    await inRollback(async (db) => {
      const { venue } = await seedBasics(db)

      const insert = db.insert(items).values({
        venueId: venue.id,
        name: 'Burger',
        station: 'kitchen',
        price: 0,
      })

      await expect(insert).rejects.toSatisfy(violates('items_price_positive'))
    })
  })
})

describe('users', () => {
  // seedBasics creates Ana with PIN '1234' in the seeded venue.
  it('rejects a second user with the same PIN in the same venue', async () => {
    await inRollback(async (db) => {
      const { venue } = await seedBasics(db)

      const insert = db.insert(users).values({
        venueId: venue.id,
        role: 'normal',
        name: 'Bob',
        pin: '1234',
      })

      await expect(insert).rejects.toSatisfy(violates('users_venue_pin_unique'))
    })
  })

  it('allows the same PIN in a different venue', async () => {
    await inRollback(async (db) => {
      // Not using the return value: the seed is here so Ana (PIN 1234) exists in the first venue.
      await seedBasics(db)

      const [otherVenue] = await db.insert(venues).values({ name: 'Other Venue' }).returning()
      if (!otherVenue) throw new Error('Failed to create other venue')

      const [bob] = await db
        .insert(users)
        .values({
          venueId: otherVenue.id,
          name: 'Bob',
          pin: '1234',
          role: 'normal',
        })
        .returning()

      expect(bob?.pin).toBe('1234')
      expect(bob?.venueId).toBe(otherVenue.id)
    })
  })
})

describe('tabs', () => {
  it('rejects a tab for 0 people (tabs_people_min_one)', async () => {
    await inRollback(async (db) => {
      const { ana, venue } = await seedBasics(db)

      const insert = db.insert(tabs).values({
        venueId: venue.id,
        people: 0,
        openedBy: ana.id,
        openedAt: new Date(),
        name: 'Test Tab',
      })

      await expect(insert).rejects.toSatisfy(violates('tabs_people_min_one'))
    })
  })

  it('rejects closing a tab before it was opened (tabs_closed_after_opened)', async () => {
    await inRollback(async (db) => {
      const { ana, venue } = await seedBasics(db)

      const insert = db.insert(tabs).values({
        venueId: venue.id,
        people: 2,
        openedBy: ana.id,
        openedAt: new Date(),
        closedAt: new Date(Date.now() - 1000), // 1 second before openedAt
        name: 'Test Tab',
      })

      await expect(insert).rejects.toSatisfy(violates('tabs_closed_after_opened'))
    })
  })
})

describe('payments', () => {
  it('accepts a cash payment with no tip', async () => {
    await inRollback(async (db) => {
      const { ana, tab } = await seedBasics(db)

      const [payment] = await db
        .insert(payments)
        .values({
          tabId: tab.id,
          method: 'cash',
          amount: 10000,
          createdBy: ana.id,
        })
        .returning()

      expect(payment?.method).toBe('cash')
      expect(payment?.tip).toBe(0)
    })
  })
  it('accepts a card payment with a tip', async () => {
    await inRollback(async (db) => {
      const { ana, tab } = await seedBasics(db)

      const [payment] = await db
        .insert(payments)
        .values({
          tabId: tab.id,
          method: 'card',
          amount: 10000,
          tip: 1000,
          createdBy: ana.id,
        })
        .returning()

      expect(payment?.method).toBe('card')
      expect(payment?.tip).toBe(1000)
    })
  })

  it('rejects a payment on a tab that doesnt exist', async () => {
    await inRollback(async (db) => {
      const { ana } = await seedBasics(db)

      const insert = db.insert(payments).values({
        tabId: 999_999,
        method: 'cash',
        amount: 10000,
        tip: 0,
        createdBy: ana.id,
      })

      await expect(insert).rejects.toSatisfy(violates('payments_tab_id_tabs_id_fk'))
    })
  })
  it('rejects amount zero', async () => {
    await inRollback(async (db) => {
      const { ana, tab } = await seedBasics(db)

      const insert = db.insert(payments).values({
        tabId: tab.id,
        method: 'cash',
        amount: 0,
        tip: 0,
        createdBy: ana.id,
      })

      await expect(insert).rejects.toSatisfy(violates('payments_amount_positive'))
    })
  })

  it('rejects negative tip', async () => {
    await inRollback(async (db) => {
      const { ana, tab } = await seedBasics(db)

      const insert = db.insert(payments).values({
        tabId: tab.id,
        method: 'card',
        amount: 10000,
        tip: -100,
        createdBy: ana.id,
      })

      await expect(insert).rejects.toSatisfy(violates('payments_tip_not_negative'))
    })
  })
  it('rejects cash payment with a tip', async () => {
    await inRollback(async (db) => {
      const { ana, tab } = await seedBasics(db)

      const insert = db.insert(payments).values({
        tabId: tab.id,
        method: 'cash',
        amount: 10000,
        tip: 100,
        createdBy: ana.id,
      })

      await expect(insert).rejects.toSatisfy(violates('payments_method_card_or_tip_zero'))
    })
  })
})
