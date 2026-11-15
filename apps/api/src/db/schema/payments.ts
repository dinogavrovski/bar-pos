import { integer, pgTable, timestamp, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { paymentMethod } from './enums.js'
import { tabs } from './tabs.js'
import { users } from './users.js'

export const payments = pgTable(
  'payments',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    tabId: integer()
      .references(() => tabs.id)
      .notNull(),
    method: paymentMethod().notNull(),
    amount: integer().notNull(),
    tip: integer().default(0).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdBy: integer()
      .references(() => users.id)
      .notNull(),
  },
  (p) => [
    check('payments_amount_positive', sql`${p.amount} > 0`),
    check('payments_tip_not_negative', sql`${p.tip} >= 0`),
    check('payments_method_card_or_tip_zero', sql`(${p.method} = 'card') OR (${p.tip} = 0)`),
  ],
)
