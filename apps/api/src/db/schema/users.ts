import { integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { venues } from './venues.js'
import { userRoles } from './enums.js'

export const users = pgTable(
  'users',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    venueId: integer()
      .references(() => venues.id)
      .notNull(),
    name: text().notNull(),
    pin: text().notNull(),
    role: userRoles().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (u) => [unique('users_venue_pin_unique').on(u.venueId, u.pin)],
)
