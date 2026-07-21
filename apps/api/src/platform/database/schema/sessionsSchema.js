import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { students } from './studentsSchema.js';

export const sessionType = pgEnum('session_type', ['morning', 'evening']);

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => students.id),
  type: sessionType('type').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  endReason: text('end_reason'),
  turnCount: integer('turn_count').notNull().default(0),
  scaffoldStage: text('scaffold_stage').notNull().default('ask'),
  questId: text('quest_id'),
  questStep: text('quest_step')
}, (table) => [index('idx_sessions_student').on(table.studentId, table.startedAt)]);

export const turnRequests = pgTable('turn_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id),
  idempotencyKey: text('idempotency_key').notNull(),
  requestHash: text('request_hash').notNull(),
  responseStatus: integer('response_status'),
  responseBody: jsonb('response_body'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true })
}, (table) => [unique('turn_requests_session_key_unique').on(table.sessionId, table.idempotencyKey)]);

export const sessionTurns = pgTable('session_turns', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id),
  role: text('role').notNull(),
  ciphertext: text('ciphertext').notNull(),
  iv: text('iv').notNull(),
  authTag: text('auth_tag').notNull(),
  keyVersion: text('key_version').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [index('idx_session_turns_session_created').on(table.sessionId, table.createdAt)]);

export const sessionRecaps = pgTable('session_recaps', {
  sessionId: uuid('session_id').primaryKey().references(() => sessions.id), studentId: uuid('student_id').notNull().references(() => students.id), title: text('title').notNull(), summary: text('summary').notNull(), discovery: text('discovery').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [index('idx_session_recaps_student_created').on(table.studentId, table.createdAt)]);

export const morningRippleEntries = pgTable('morning_ripple_entries', {
  id: uuid('id').primaryKey().defaultRandom(), studentId: uuid('student_id').notNull().references(() => students.id), sessionId: uuid('session_id').notNull().references(() => sessions.id), mood: text('mood').notNull(), energy: text('energy').notNull(), path: text('path').notNull(), activityId: text('activity_id').notNull(), activityResult: text('activity_result'), intention: text('intention').notNull(), theme: text('theme').notNull(), collectible: text('collectible').notNull(), contentSource: text('content_source').notNull(), prompt: text('prompt'), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [index('idx_morning_ripple_student_created').on(table.studentId, table.createdAt), unique('morning_ripple_session_unique').on(table.sessionId)]);
