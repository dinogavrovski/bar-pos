import { describe, expect, it } from 'vitest'
import { takePaymentInput, MAX_PAYMENT_DEN, MAX_TIP_DEN } from './payments.js'

// A valid payment to start from; each test changes ONE thing, so it breaks exactly one rule.
// Amounts are in CENTS: 86000 = 860 den.
const cash = { method: 'cash', amount: 86000 }

// The first error's path and message, e.g. { path: ['tip'], message: '...' }.
function firstIssue(result: ReturnType<typeof takePaymentInput.safeParse>) {
  const issue = result.error?.issues[0]
  return { path: issue?.path, message: issue?.message }
}

describe('takePaymentInput', () => {
  // Example to copy: accepted, and the default filled in.
  it('accepts a cash payment and defaults the tip to 0', () => {
    const result = takePaymentInput.safeParse(cash)

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ method: 'cash', amount: 86000, tip: 0 })
  })

  // Example to copy: rejected, checking WHERE (path) and WHAT (message).
  it('rejects an unknown method', () => {
    const result = takePaymentInput.safeParse({ ...cash, method: 'crypto' })

    expect(firstIssue(result)).toEqual({
      path: ['method'],
      message: 'Payment method must be cash or card',
    })
  })

  // --- your turn ---
  // method + tip (the refine)
  it('accepts a card payment with a tip', () => {
    const result = takePaymentInput.safeParse({ ...cash, method: 'card', tip: 1000 })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ method: 'card', amount: 86000, tip: 1000 })
  })
  it('accepts a card payment with tip 0', () => {
    const result = takePaymentInput.safeParse({ ...cash, method: 'card', tip: 0 })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ method: 'card', amount: 86000, tip: 0 })
  }) // the edge of the refine
  it('rejects a cash payment with a tip', () => {
    const result = takePaymentInput.safeParse({ ...cash, method: 'cash', tip: 1000 })

    expect(firstIssue(result)).toEqual({
      path: ['tip'],
      message: 'Tip must be 0 den for cash payments',
    })
  }) // path ['tip'] + message

  // amount
  it('rejects amount 0', () => {
    const result = takePaymentInput.safeParse({ ...cash, amount: 0 })

    expect(firstIssue(result)).toEqual({ path: ['amount'], message: 'Amount must be > 0' })
  })
  it('rejects a decimal amount (860.5 cents)', () => {
    const result = takePaymentInput.safeParse({ ...cash, amount: 860.5 })

    expect(firstIssue(result)).toEqual({
      path: ['amount'],
      message: 'Please provide a whole number',
    })
  })
  it('accepts an amount of exactly MAX_PAYMENT_DEN * 100', () => {
    const result = takePaymentInput.safeParse({ ...cash, amount: MAX_PAYMENT_DEN * 100 })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ method: 'cash', amount: MAX_PAYMENT_DEN * 100, tip: 0 })
  })
  it('rejects an amount one cent over the max', () => {
    const result = takePaymentInput.safeParse({ ...cash, amount: MAX_PAYMENT_DEN * 100 + 1 })

    expect(firstIssue(result)).toEqual({
      path: ['amount'],
      message: `Amount must be at most ${MAX_PAYMENT_DEN} den`,
    })
  })

  // tip
  it('rejects a negative tip', () => {
    const result = takePaymentInput.safeParse({ ...cash, method: 'card', tip: -1 })

    expect(firstIssue(result)).toEqual({ path: ['tip'], message: "Tip can't be negative" })
  })
  it('accepts a tip of exactly MAX_TIP_DEN * 100', () => {
    const result = takePaymentInput.safeParse({ ...cash, method: 'card', tip: MAX_TIP_DEN * 100 })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ method: 'card', amount: 86000, tip: MAX_TIP_DEN * 100 })
  })
  it('rejects a tip one cent over the max', () => {
    const result = takePaymentInput.safeParse({
      ...cash,
      method: 'card',
      tip: MAX_TIP_DEN * 100 + 1,
    })

    expect(firstIssue(result)).toEqual({
      path: ['tip'],
      message: `Tip must be at most ${MAX_TIP_DEN} den`,
    })
  })

  // fields the client must not set
  it('drops tabId, shiftId and createdBy', () => {
    const result = takePaymentInput.safeParse({ ...cash, tabId: 1, shiftId: 2, createdBy: 3 })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ method: 'cash', amount: 86000, tip: 0 })
  })
})
