// Tries to break each database rule on tabs and expects Postgres to refuse.
// Every test runs inside inRollback(), so nothing is left in the database afterwards.
import { afterAll, describe, expect, it } from 'vitest'
import { pool } from '../client.js'
import { inRollback, seedBasics, violates } from '../../test/db.js'
import { tabs } from './index.js'

// Each test file runs in its own worker with its own pool, so close it here.
afterAll(async () => {
  await pool.end()
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
