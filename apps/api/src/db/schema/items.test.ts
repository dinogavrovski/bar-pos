// Tries to break each database rule on items and expects Postgres to refuse.
// Every test runs inside inRollback(), so nothing is left in the database afterwards.
import { eq } from 'drizzle-orm'
import { afterAll, describe, expect, it } from 'vitest'
import { pool } from '../client.js'
import { inRollback, pgErrorCode, seedBasics, violates } from '../../test/db.js'
import { items, tabItems } from './index.js'

// Each test file runs in its own worker with its own pool, so close it here.
afterAll(async () => {
  await pool.end()
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
