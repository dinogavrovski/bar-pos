import { integer, pgTable, timestamp, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { tabs } from './tabs.js'
import { items } from './items.js'
import { users } from './users.js'

export const tabItems = pgTable(
  'tab_items',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    tabId: integer()
      .references(() => tabs.id)
      .notNull(),
    itemId: integer()
      .references(() => items.id)
      .notNull(),
    person: integer(),
    price: integer().notNull(),
    sentAt: timestamp({ withTimezone: true }),
    voidedAt: timestamp({ withTimezone: true }),
    voidedBy: integer().references(() => users.id),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdBy: integer()
      .references(() => users.id)
      .notNull(),
  },
  (ti) => [
    check('tab_items_price_positive', sql`${ti.price} > 0`),
    check('tab_items_void_complete', sql`(${ti.voidedAt} IS NULL) = (${ti.voidedBy} IS NULL)`),
  ],
)
