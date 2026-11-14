import { integer, pgTable, text, timestamp, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { venues } from './venues.js'
import { stationType } from './enums.js'

export const items = pgTable(
  'items',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    venueId: integer()
      .references(() => venues.id)
      .notNull(),
    name: text().notNull(),
    description: text(),
    station: stationType().notNull(),
    price: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (i) => [check('items_price_positive', sql`${i.price} > 0`)],
)
