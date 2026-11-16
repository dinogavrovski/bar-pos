// Wipes the database and fills it with a demo bar: one venue, staff and the full menu.
// Run with `pnpm db:seed`. Safe to run again: you always end up with the same clean state.
import { sql } from 'drizzle-orm'
import { db, pool } from '../client.js'
import { items, users, venues } from '../schema/index.js'
import { menu } from './menu.js'

// --- Safety guard ------------------------------------------------------------------------
// This script DELETES EVERYTHING. Only allow it on a local database, unless --force is given
// (e.g. the nightly demo reset in Phase 7). `db` is the Postgres host inside docker-compose.
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', 'db']
const host = new URL(process.env.DATABASE_URL ?? '').hostname
if (!LOCAL_HOSTS.includes(host) && !process.argv.includes('--force')) {
  console.error(`Refusing to seed: DATABASE_URL points at "${host}", not a local database.`)
  console.error('This would delete all data. Re-run with --force if you really mean it.')
  process.exit(1)
}

// --- Demo data ---------------------------------------------------------------------------
// PINs are plain text until Phase 4 (hashing comes with auth).
const staff = [
  { name: 'Hristijan', pin: '9090', role: 'admin' },
  { name: 'Aleksandar', pin: '1010', role: 'normal' },
  { name: 'Dino', pin: '2020', role: 'normal' },
  { name: 'Ivo', pin: '3030', role: 'normal' },
  { name: 'Martin', pin: '4040', role: 'normal' },
] as const

async function seed() {
  // One transaction: if anything fails, nothing is deleted and nothing is half-inserted.
  await db.transaction(async (tx) => {
    // Empty every table in the public schema, so new tables are included automatically.
    // RESTART IDENTITY resets ids to 1; CASCADE handles the foreign keys between them.
    // Drizzle's own migrations table lives in the "drizzle" schema, so it's not touched.
    const { rows } = await tx.execute<{ tablename: string }>(
      sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    )
    if (rows.length > 0) {
      const tables = rows.map((r) => `"${r.tablename}"`).join(', ')
      await tx.execute(sql.raw(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`))
    }

    const [venue] = await tx.insert(venues).values({ name: 'Bar Demo' }).returning()
    if (!venue) throw new Error('seed failed: venue')

    await tx.insert(users).values(staff.map((s) => ({ ...s, venueId: venue.id })))

    const menuRows = menu.flatMap((cat) =>
      cat.items.map(([name, priceDen, description]) => ({
        venueId: venue.id,
        name,
        description: description ?? null,
        station: cat.station,
        price: priceDen * 100, // denars -> cents
      })),
    )
    await tx.insert(items).values(menuRows)

    console.log(`Seeded "${venue.name}": ${staff.length} staff, ${menuRows.length} menu items.`)
  })
}

seed()
  .catch((err: unknown) => {
    console.error('Seed failed:', err)
    process.exitCode = 1
  })
  .finally(() => pool.end())
