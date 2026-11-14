import { integer, pgTable, text, timestamp, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users.js'
import { venues } from './venues.js'

export const tabs = pgTable(
  'tabs',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    venueId: integer()
      .references(() => venues.id)
      .notNull(),
    openedBy: integer()
      .references(() => users.id)
      .notNull(),
    name: text().notNull(),
    people: integer().notNull(),
    openedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    check('tabs_people_min_one', sql`${t.people} >= 1`),
    check('tabs_closed_after_opened', sql`${t.closedAt} > ${t.openedAt}`),
  ],
)
