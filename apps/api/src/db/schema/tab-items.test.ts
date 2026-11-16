// Tries to break each database rule on tab_items and expects Postgres to refuse.
// Every test runs inside inRollback(), so nothing is left in the database afterwards.
import { afterAll, describe, expect, it } from 'vitest'
import { pool } from '../client.js'
import { inRollback, seedBasics, violates } from '../../test/db.js'
import { tabItems } from './index.js'

// Each test file runs in its own worker with its own pool, so close it here.
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
