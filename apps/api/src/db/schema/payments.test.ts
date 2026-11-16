// Tries to break each database rule on payments and expects Postgres to refuse.
// Every test runs inside inRollback(), so nothing is left in the database afterwards.
import { afterAll, describe, expect, it } from 'vitest'
import { pool } from '../client.js'
import { inRollback, seedBasics, violates } from '../../test/db.js'
import { payments } from './index.js'

// Each test file runs in its own worker with its own pool, so close it here.
afterAll(async () => {
  await pool.end()
})

describe('payments', () => {
  it('accepts a cash payment with no tip', async () => {
    await inRollback(async (db) => {
      const { ana, tab, shift } = await seedBasics(db)

      const [payment] = await db
        .insert(payments)
        .values({
          tabId: tab.id,
          shiftId: shift.id,
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
      const { ana, tab, shift } = await seedBasics(db)

      const [payment] = await db
        .insert(payments)
        .values({
          tabId: tab.id,
          shiftId: shift.id,
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
      const { ana, shift } = await seedBasics(db)

      const insert = db.insert(payments).values({
        tabId: 999_999,
        method: 'cash',
        shiftId: shift.id,
        amount: 10000,
        tip: 0,
        createdBy: ana.id,
      })

      await expect(insert).rejects.toSatisfy(violates('payments_tab_id_tabs_id_fk'))
    })
  })
  it('rejects amount zero', async () => {
    await inRollback(async (db) => {
      const { ana, tab, shift } = await seedBasics(db)

      const insert = db.insert(payments).values({
        tabId: tab.id,
        method: 'cash',
        shiftId: shift.id,
        amount: 0,
        tip: 0,
        createdBy: ana.id,
      })

      await expect(insert).rejects.toSatisfy(violates('payments_amount_positive'))
    })
  })

  it('rejects negative tip', async () => {
    await inRollback(async (db) => {
      const { ana, tab, shift } = await seedBasics(db)

      const insert = db.insert(payments).values({
        tabId: tab.id,
        method: 'card',
        shiftId: shift.id,
        amount: 10000,
        tip: -100,
        createdBy: ana.id,
      })

      await expect(insert).rejects.toSatisfy(violates('payments_tip_not_negative'))
    })
  })
  it('rejects cash payment with a tip', async () => {
    await inRollback(async (db) => {
      const { ana, tab, shift } = await seedBasics(db)

      const insert = db.insert(payments).values({
        tabId: tab.id,
        method: 'cash',
        shiftId: shift.id,
        amount: 10000,
        tip: 100,
        createdBy: ana.id,
      })

      await expect(insert).rejects.toSatisfy(violates('payments_method_card_or_tip_zero'))
    })
  })

  // Use a shiftId that doesn't exist → violates('payments_shift_id_shifts_id_fk')
  it('rejects a payment on a shift that does not exist', async () => {
    await inRollback(async (db) => {
      const { ana, tab } = await seedBasics(db)

      const insert = db.insert(payments).values({
        tabId: tab.id,
        method: 'cash',
        shiftId: 999_999,
        amount: 10000,
        tip: 0,
        createdBy: ana.id,
      })

      await expect(insert).rejects.toSatisfy(violates('payments_shift_id_shifts_id_fk'))
    })
  })
})
