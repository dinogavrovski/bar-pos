import { describe, expect, it } from 'vitest'
import { openTabInput } from './tabs.js'

// Pure unit tests: no database, no server. safeParse() never throws, it returns
// { success: true, data } or { success: false, error } so we can check either case.

// Returns the error messages for one field, e.g. messagesFor(result, 'people').
function messagesFor(result: ReturnType<typeof openTabInput.safeParse>, field: string) {
  if (result.success) return []
  return result.error.issues.filter((i) => i.path[0] === field).map((i) => i.message)
}

describe('openTabInput', () => {
  // Example to copy: an accepted input, and a check that it was cleaned.
  it('accepts a normal tab and trims the name', () => {
    const result = openTabInput.safeParse({ name: "  Marko's group ", people: 3 })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ name: "Marko's group", people: 3 })
  })

  // Example to copy: a rejected input, checking the MESSAGE the waiter will see.
  it('rejects an empty name', () => {
    const result = openTabInput.safeParse({ name: '', people: 3 })

    expect(result.success).toBe(false)
    expect(messagesFor(result, 'name')).toEqual(['Name is required'])
  })

  // --- your turn: one rule per test, and assert the exact message ---
  it('rejects a whitespace-only name', () => {
    const result = openTabInput.safeParse({ name: '   ', people: 3 })

    expect(result.success).toBe(false)
    expect(messagesFor(result, 'name')).toEqual(['Name is required'])
  })
  it('rejects a name over 50 characters', () => {
    const result = openTabInput.safeParse({
      name: 'a'.repeat(51),
      people: 3,
    })

    expect(result.success).toBe(false)
    expect(messagesFor(result, 'name')).toEqual(['Name must be at most 50 characters'])
  })
  it('accepts a name of exactly 50 characters', () => {
    const result = openTabInput.safeParse({
      name: 'a'.repeat(50),
      people: 3,
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      name: 'a'.repeat(50),
      people: 3,
    })
  }) // the edge: 50 is allowed
  it('rejects 0 people', () => {
    const result = openTabInput.safeParse({ name: 'Marko', people: 0 })

    expect(result.success).toBe(false)
    expect(messagesFor(result, 'people')).toEqual(['Number of people must be > 0'])
  })
  it('rejects 2.5 people', () => {
    const result = openTabInput.safeParse({ name: 'Marko', people: 2.5 })

    expect(result.success).toBe(false)
    expect(messagesFor(result, 'people')).toEqual(['Please provide a whole number'])
  })
  it('rejects more than 100 people', () => {
    const result = openTabInput.safeParse({ name: 'Marko', people: 101 })

    expect(result.success).toBe(false)
    expect(messagesFor(result, 'people')).toEqual(['People must be at most 100'])
  })
  it('accepts exactly 100 people', () => {
    const result = openTabInput.safeParse({ name: 'Marko', people: 100 })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ name: 'Marko', people: 100 })
  }) // the edge: 100 is allowed
  it('drops fields the client must not set (openedBy, venueId)', () => {
    const result = openTabInput.safeParse({
      name: 'Marko',
      people: 3,
      openedBy: 1,
      venueId: 2,
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ name: 'Marko', people: 3 })
  })
})
