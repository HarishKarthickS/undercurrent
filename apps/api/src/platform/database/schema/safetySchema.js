import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sessions } from './sessionsSchema.js';
import { students } from './studentsSchema.js';

export const safetyEvents = pgTable('safety_events', {
  id: uuid('id').primaryKey().defaultRandom(), studentId: uuid('student_id').notNull().references(() => students.id), sessionId: uuid('session_id').references(() => sessions.id), category: text('category').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }), emailStatus: text('email_status').notNull().default('pending')
}, (table) => [index('idx_safety_student_created').on(table.studentId, table.createdAt)]);
