import { integer, pgTable, timestamp, check, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { venues } from './venues.js'
import { users } from './users.js'

export const shifts = pgTable(
  'shifts',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    venueId: integer()
      .references(() => venues.id)
      .notNull(),
    openedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    openedBy: integer()
      .references(() => users.id)
      .notNull(),
    startingCash: integer().notNull(),
    closedAt: timestamp({ withTimezone: true }),
    closedBy: integer().references(() => users.id),
    countedCash: integer(),
  },
  (s) => [
    check('shifts_starting_cash_not_negative', sql`${s.startingCash} >= 0`),
    check(
      'shifts_closed_after_opened',
      sql`${s.closedAt} IS NULL OR ${s.closedAt} > ${s.openedAt}`,
    ),
    check(
      'shifts_counted_cash_not_negative',
      sql`${s.countedCash} IS NULL OR ${s.countedCash} >= 0`,
    ),
    check(
      'shifts_close_complete',
      sql`(${s.closedAt} IS NULL) = (${s.closedBy} IS NULL) AND (${s.closedAt} IS NULL) = (${s.countedCash} IS NULL)`,
    ),
    // Only one OPEN shift per venue. A normal unique on venueId would allow one shift ever;
    // the WHERE makes the rule apply only to rows that are still open (closedAt IS NULL).
    uniqueIndex('shifts_one_open_per_venue')
      .on(s.venueId)
      .where(sql`${s.closedAt} IS NULL`),
  ],
)
