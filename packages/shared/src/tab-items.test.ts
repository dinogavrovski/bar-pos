import { describe, expect, it } from 'vitest'
import { addItemsInput, MAX_LINES, MAX_NOTE_LENGTH, MAX_QUANTITY } from './tab-items.js'

// A valid line to start from; each test changes ONE thing, so it breaks exactly one rule.
const skopsko = { itemId: 37, quantity: 2 }

// Parses an order with a single line built from `skopsko` plus the given changes.
function parseLine(changes: Record<string, unknown>) {
  return addItemsInput.safeParse({ items: [{ ...skopsko, ...changes }] })
}

// The first error's path and message, e.g. { path: ['items', 0, 'quantity'], message: '...' }.
function firstIssue(result: ReturnType<typeof addItemsInput.safeParse>) {
  const issue = result.error?.issues[0]
  return { path: issue?.path, message: issue?.message }
}

describe('addItemsInput', () => {
  // --- accepted ---
  it('accepts a normal order', () => {
    const result = addItemsInput.safeParse({
      items: [
        { itemId: 37, quantity: 2, person: 1 },
        { itemId: 12, quantity: 1, person: 2, note: 'no olives' },
        { itemId: 5, quantity: 1 },
      ],
    })

    expect(result.success).toBe(true)
    expect(result.data?.items).toHaveLength(3)
    expect(result.data?.items[1]).toEqual({ itemId: 12, quantity: 1, person: 2, note: 'no olives' })
  })

  it('drops fields the client must not set, like price', () => {
    const result = parseLine({ price: 1, createdBy: 1 })

    expect(result.data?.items[0]).toEqual(skopsko)
  })

  // --- the list ---
  it('rejects an empty order', () => {
    const result = addItemsInput.safeParse({ items: [] })

    expect(firstIssue(result)).toEqual({ path: ['items'], message: 'Add at least one item' })
  })

  it(`accepts exactly ${MAX_LINES} lines`, () => {
    const result = addItemsInput.safeParse({
      items: Array.from({ length: MAX_LINES }, () => skopsko),
    })

    expect(result.success).toBe(true)
  })

  it(`rejects ${MAX_LINES + 1} lines`, () => {
    const result = addItemsInput.safeParse({
      items: Array.from({ length: MAX_LINES + 1 }, () => skopsko),
    })

    expect(firstIssue(result)).toEqual({
      path: ['items'],
      message: `At most ${MAX_LINES} lines per order`,
    })
  })

  // --- itemId ---
  it('rejects itemId 0', () => {
    expect(firstIssue(parseLine({ itemId: 0 }))).toEqual({
      path: ['items', 0, 'itemId'],
      message: 'Pick an item from the menu',
    })
  })

  // --- quantity ---
  it('rejects quantity 0', () => {
    expect(firstIssue(parseLine({ quantity: 0 }))).toEqual({
      path: ['items', 0, 'quantity'],
      message: 'Quantity must be at least 1',
    })
  })

  it(`accepts quantity ${MAX_QUANTITY}`, () => {
    expect(parseLine({ quantity: MAX_QUANTITY }).success).toBe(true)
  })

  it(`rejects quantity ${MAX_QUANTITY + 1}`, () => {
    expect(firstIssue(parseLine({ quantity: MAX_QUANTITY + 1 }))).toEqual({
      path: ['items', 0, 'quantity'],
      message: `Quantity must be at most ${MAX_QUANTITY}`,
    })
  })

  // --- person ---
  it('rejects person 0', () => {
    expect(firstIssue(parseLine({ person: 0 }))).toEqual({
      path: ['items', 0, 'person'],
      message: 'Person must be at least 1',
    })
  })

  // --- note ---
  it('trims a note', () => {
    expect(parseLine({ note: '  no olives  ' }).data?.items[0]?.note).toBe('no olives')
  })

  it('turns a whitespace-only note into no note', () => {
    const result = parseLine({ note: ' \n\t ' })

    expect(result.success).toBe(true)
    expect(result.data?.items[0]?.note).toBeUndefined()
  })

  it(`accepts a note of exactly ${MAX_NOTE_LENGTH} characters`, () => {
    expect(parseLine({ note: 'a'.repeat(MAX_NOTE_LENGTH) }).success).toBe(true)
  })

  it(`rejects a note of ${MAX_NOTE_LENGTH + 1} characters`, () => {
    expect(firstIssue(parseLine({ note: 'a'.repeat(MAX_NOTE_LENGTH + 1) }))).toEqual({
      path: ['items', 0, 'note'],
      message: `Note must be at most ${MAX_NOTE_LENGTH} characters`,
    })
  })

  it('points at the right line when the second one is wrong', () => {
    const result = addItemsInput.safeParse({ items: [skopsko, { ...skopsko, quantity: 0 }] })

    expect(firstIssue(result).path).toEqual(['items', 1, 'quantity'])
  })
})
