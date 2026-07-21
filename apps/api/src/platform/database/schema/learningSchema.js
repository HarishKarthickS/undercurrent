import { doublePrecision, index, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { sessions } from './sessionsSchema.js';
import { students } from './studentsSchema.js';

export const topics = pgTable('topics', {
  id: uuid('id').primaryKey().defaultRandom(), studentId: uuid('student_id').notNull().references(() => students.id), label: text('label').notNull(), firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(), nextReviewAt: timestamp('next_review_at', { withTimezone: true }), ease: doublePrecision('ease').notNull().default(2.5), intervalDays: integer('interval_days').notNull().default(0)
}, (table) => [unique('topics_student_label_unique').on(table.studentId, table.label), index('idx_topics_student_next_review').on(table.studentId, table.nextReviewAt, table.label)]);

export const scores = pgTable('scores', {
  id: uuid('id').primaryKey().defaultRandom(), sessionId: uuid('session_id').notNull().references(() => sessions.id), topicId: uuid('topic_id').notNull().references(() => topics.id), understanding: integer('understanding'), confidence: integer('confidence'), gapLabel: text('gap_label'), assessedAt: timestamp('assessed_at', { withTimezone: true }).notNull().defaultNow(), assessorAgreement: integer('assessor_agreement')
}, (table) => [index('idx_scores_topic_assessed').on(table.topicId, table.assessedAt)]);

export const wins = pgTable('wins', {
  id: uuid('id').primaryKey().defaultRandom(), studentId: uuid('student_id').notNull().references(() => students.id), sessionId: uuid('session_id').references(() => sessions.id), type: text('type').notNull(), message: text('message').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [index('idx_wins_student_created').on(table.studentId, table.createdAt)]);
