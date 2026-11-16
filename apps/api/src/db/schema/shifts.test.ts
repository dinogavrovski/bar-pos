// Tries to break each database rule on shifts and expects Postgres to refuse.
// Every test runs inside inRollback(), so nothing is left in the database afterwards.
import { eq } from 'drizzle-orm'
import { afterAll, describe, expect, it } from 'vitest'
import { pool } from '../client.js'
import { inRollback, seedBasics, violates } from '../../test/db.js'
import { shifts, venues } from './index.js'

// Each test file runs in its own worker with its own pool, so close it here.
afterAll(async () => {
  await pool.end()
})

// seedBasics already opens one shift for the venue: use it as "the open shift".
describe('shifts', () => {
  // --- accepted ---
  // Only the required fields; expect closedAt, closedBy and countedCash to be null.
  // (Use a new venue, or the seeded shift will block it via the partial index.)
  it('accepts an open shift', async () => {
    await inRollback(async (db) => {
      const { ana } = await seedBasics(db)

      const [otherVenue] = await db.insert(venues).values({ name: 'Other Venue' }).returning()
      if (!otherVenue) throw new Error('Failed to create other venue')

      const [shift] = await db
        .insert(shifts)
        .values({
          venueId: otherVenue.id,
          openedBy: ana.id,
          startingCash: 10000,
        })
        .returning()

      expect(shift?.closedAt).toBeNull()
      expect(shift?.closedBy).toBeNull()
      expect(shift?.countedCash).toBeNull()
    })
  })
  // Update the seeded shift: closedAt, closedBy and countedCash all set.
  it('accepts a properly closed shift', async () => {
    await inRollback(async (db) => {
      const { ana, shift } = await seedBasics(db)

      const [closed] = await db
        .update(shifts)
        .set({
          closedAt: new Date(),
          closedBy: ana.id,
          countedCash: 10000,
        })
        .where(eq(shifts.id, shift.id))
        .returning()

      expect(closed?.closedAt).not.toBeNull()
      expect(closed?.closedBy).toBe(ana.id)
      expect(closed?.countedCash).toBe(10000)
    })
  })
  it('accepts a closed shift with countedCash 0', async () => {
    await inRollback(async (db) => {
      const { ana, shift } = await seedBasics(db)

      const [closed] = await db
        .update(shifts)
        .set({
          closedAt: new Date(),
          closedBy: ana.id,
          countedCash: 0,
        })
        .where(eq(shifts.id, shift.id))
        .returning()

      expect(closed?.closedAt).not.toBeNull()
      expect(closed?.closedBy).toBe(ana.id)
      expect(closed?.countedCash).toBe(0)
    })
  })

  // --- rejected: each breaks exactly ONE rule ---
  it('rejects a negative startingCash', async () => {
    await inRollback(async (db) => {
      const { ana, venue } = await seedBasics(db)

      const insert = db.insert(shifts).values({
        venueId: venue.id,
        openedBy: ana.id,
        startingCash: -10000,
      })

      await expect(insert).rejects.toSatisfy(violates('shifts_starting_cash_not_negative'))
    })
  }) // shifts_starting_cash_not_negative
  // Close it properly in every other way, so only this rule is broken.
  it('rejects a negative countedCash', async () => {
    await inRollback(async (db) => {
      const { ana, shift } = await seedBasics(db)

      const update = db
        .update(shifts)
        .set({
          closedAt: new Date(),
          closedBy: ana.id,
          countedCash: -10000,
        })
        .where(eq(shifts.id, shift.id))

      await expect(update).rejects.toSatisfy(violates('shifts_counted_cash_not_negative'))
    })
  }) // shifts_counted_cash_not_negative
  it('rejects closedAt without closedBy and countedCash', async () => {
    await inRollback(async (db) => {
      const { shift } = await seedBasics(db)

      const update = db
        .update(shifts)
        .set({
          closedAt: new Date(),
        })
        .where(eq(shifts.id, shift.id))

      await expect(update).rejects.toSatisfy(violates('shifts_close_complete'))
    })
  }) // shifts_close_complete
  it('rejects closedAt and closedBy without countedCash', async () => {
    await inRollback(async (db) => {
      const { ana, shift } = await seedBasics(db)

      const update = db
        .update(shifts)
        .set({
          closedAt: new Date(),
          closedBy: ana.id,
        })
        .where(eq(shifts.id, shift.id))

      await expect(update).rejects.toSatisfy(violates('shifts_close_complete'))
    })
  }) // shifts_close_complete
  it('rejects countedCash on an open shift', async () => {
    await inRollback(async (db) => {
      const { shift } = await seedBasics(db)

      const update = db
        .update(shifts)
        .set({
          countedCash: 10000,
        })
        .where(eq(shifts.id, shift.id))

      await expect(update).rejects.toSatisfy(violates('shifts_close_complete'))
    })
  }) // shifts_close_complete
  // Set openedAt yourself, and closedAt earlier than it.
  it('rejects a shift closed before it opened', async () => {
    await inRollback(async (db) => {
      const { ana, venue } = await seedBasics(db)

      const insert = db.insert(shifts).values({
        venueId: venue.id,
        openedBy: ana.id,
        startingCash: 10000,
        openedAt: new Date(),
        closedAt: new Date(Date.now() - 1000), // 1 second before openedAt
        closedBy: ana.id,
        countedCash: 10000,
      })

      await expect(insert).rejects.toSatisfy(violates('shifts_closed_after_opened'))
    })
  }) // shifts_closed_after_opened
  it('rejects a shift for a venue that does not exist', async () => {
    await inRollback(async (db) => {
      const { ana } = await seedBasics(db)

      const insert = db.insert(shifts).values({
        venueId: 999_999,
        openedBy: ana.id,
        startingCash: 10000,
      })

      await expect(insert).rejects.toSatisfy(violates('shifts_venue_id_venues_id_fk'))
    })
  }) // shifts_venue_id_venues_id_fk

  // --- one open shift per venue (partial unique index) ---
  it('rejects a second open shift in the same venue', async () => {
    await inRollback(async (db) => {
      const { ana, venue } = await seedBasics(db)

      const insert = db.insert(shifts).values({
        venueId: venue.id,
        openedBy: ana.id,
        startingCash: 10000,
      })

      await expect(insert).rejects.toSatisfy(violates('shifts_one_open_per_venue'))
    })
  }) // shifts_one_open_per_venue
  it('accepts an open shift in another venue at the same time', async () => {
    await inRollback(async (db) => {
      const { ana } = await seedBasics(db)

      const [otherVenue] = await db.insert(venues).values({ name: 'Other Venue' }).returning()

      if (!otherVenue) throw new Error('Failed to create other venue')

      const [shift] = await db
        .insert(shifts)
        .values({
          venueId: otherVenue.id,
          openedBy: ana.id,
          startingCash: 10000,
        })
        .returning()

      expect(shift?.venueId).toBe(otherVenue.id)
    })
  }) // shifts_one_open_per_venue
  // Close the seeded shift (all three fields), then open a new one.
  it('accepts a new open shift after the previous one closed', async () => {
    await inRollback(async (db) => {
      const { ana, shift } = await seedBasics(db)

      const [closed] = await db
        .update(shifts)
        .set({
          closedAt: new Date(),
          closedBy: ana.id,
          countedCash: 10000,
        })
        .where(eq(shifts.id, shift.id))
        .returning()

      expect(closed?.closedAt).not.toBeNull()
      expect(closed?.closedBy).toBe(ana.id)
      expect(closed?.countedCash).toBe(10000)

      const [newShift] = await db
        .insert(shifts)
        .values({
          venueId: shift.venueId,
          openedBy: ana.id,
          startingCash: 10000,
        })
        .returning()

      expect(newShift?.venueId).toBe(shift.venueId)
    })
  }) // shifts_one_open_per_venue
})
