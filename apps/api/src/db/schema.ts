// Table definitions go here. Drizzle reads this file to generate migrations.
import { pgTable, integer, text, timestamp } from 'drizzle-orm/pg-core'

export const venues = pgTable('venues', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})
