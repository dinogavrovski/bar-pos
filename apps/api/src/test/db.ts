// Test helpers for tests that talk to the real database.
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { pool } from '../db/client.js'
import * as schema from '../db/schema/index.js'

export type TestDb = NodePgDatabase<typeof schema>

/**
 * Runs `fn` inside a transaction that is ALWAYS rolled back afterwards.
 * Every test gets a clean database and leaves nothing behind, so tests can't
 * affect each other and can run in any order.
 */
export async function inRollback<T>(fn: (db: TestDb) => Promise<T>): Promise<T> {
  // Take ONE connection from the pool: a transaction only exists on a single connection.
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // A Drizzle instance bound to that one connection (same casing as the real client).
    const db = drizzle(client, { schema, casing: 'snake_case' })
    return await fn(db)
  } finally {
    // Runs whether the test passed, failed or threw: undo everything, give the connection back.
    await client.query('ROLLBACK')
    client.release()
  }
}

/**
 * Inserts the minimum rows most tests need: one venue, an admin and a normal user,
 * a bar item and an open tab. Returns them so tests can use their ids.
 */
export async function seedBasics(db: TestDb) {
  const [venue] = await db.insert(schema.venues).values({ name: 'Test Bar' }).returning()
  if (!venue) throw new Error('seed failed: venue')

  const [ana, bojan] = await db
    .insert(schema.users)
    .values([
      { venueId: venue.id, name: 'Ana', pin: '1234', role: 'normal' },
      { venueId: venue.id, name: 'Bojan', pin: '5678', role: 'admin' },
    ])
    .returning()
  if (!ana || !bojan) throw new Error('seed failed: users')

  const [espresso] = await db
    .insert(schema.items)
    .values({ venueId: venue.id, name: 'Espresso', station: 'bar', price: 8000 })
    .returning()
  if (!espresso) throw new Error('seed failed: item')

  const [shift] = await db
    .insert(schema.shifts)
    .values({ venueId: venue.id, openedBy: bojan.id, startingCash: 500000 })
    .returning()
  if (!shift) throw new Error('seed failed: shift')

  const [tab] = await db
    .insert(schema.tabs)
    .values({ venueId: venue.id, openedBy: ana.id, name: "Marko's group", people: 3 })
    .returning()
  if (!tab) throw new Error('seed failed: tab')

  return { venue, ana, bojan, espresso, tab, shift }
}

// Drizzle wraps Postgres errors in its own error; the original Postgres error is in `.cause`.
function pgCause(err: unknown): Record<string, unknown> | undefined {
  if (err instanceof Error && typeof err.cause === 'object' && err.cause !== null) {
    return err.cause as Record<string, unknown>
  }
  return undefined
}

/**
 * True if the error was caused by the named constraint (CHECK, UNIQUE or foreign key).
 * Use with: await expect(promise).rejects.toSatisfy(violates('tab_items_void_complete'))
 */
export function violates(constraint: string) {
  return (err: unknown) => pgCause(err)?.constraint === constraint
}

/**
 * True if Postgres failed with this error code. Some errors have no constraint name,
 * e.g. a bad enum value is code '22P02' (invalid text representation).
 * Codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export function pgErrorCode(code: string) {
  return (err: unknown) => pgCause(err)?.code === code
}
