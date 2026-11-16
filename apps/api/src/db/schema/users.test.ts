// Tries to break each database rule on users and expects Postgres to refuse.
// Every test runs inside inRollback(), so nothing is left in the database afterwards.
import { afterAll, describe, expect, it } from 'vitest'
import { pool } from '../client.js'
import { inRollback, seedBasics, violates } from '../../test/db.js'
import { users, venues } from './index.js'

// Each test file runs in its own worker with its own pool, so close it here.
afterAll(async () => {
  await pool.end()
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
