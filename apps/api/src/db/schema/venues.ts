import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

// A bar or restaurant. Every other table belongs to a venue (directly or through a tab).
export const venues = pgTable('venues', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})
