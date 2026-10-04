import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

export const {{pluralCamel}} = pgTable('{{pluralSnake}}', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
