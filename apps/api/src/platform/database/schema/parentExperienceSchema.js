import { boolean, index, integer, jsonb, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { households, parentAccounts } from './identitySchema.js';
import { students } from './studentsSchema.js';

export const householdPreferences = pgTable('household_preferences', {
  householdId: uuid('household_id').primaryKey().references(() => households.id),
  locale: text('locale').notNull().default('en'),
  dailyDigestEnabled: boolean('daily_digest_enabled').notNull().default(true),
  weeklyDigestEnabled: boolean('weekly_digest_enabled').notNull().default(true),
  productAnalyticsConsent: boolean('product_analytics_consent').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const parentChildPreferences = pgTable('parent_child_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id').notNull().references(() => parentAccounts.id),
  studentId: uuid('student_id').notNull().references(() => students.id),
  dashboardLayout: jsonb('dashboard_layout').notNull().default([]),
  guidanceMode: text('guidance_mode').notNull().default('gentle'),
  goalType: text('goal_type').notNull().default('sessions'),
  goalTarget: integer('goal_target').notNull().default(3),
  transcriptConsent: boolean('transcript_consent').notNull().default(false),
  advisorConsent: boolean('advisor_consent').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [unique('parent_child_preferences_parent_student_unique').on(table.parentId, table.studentId)]);

export const productAnalyticsEvents = pgTable('product_analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id),
  eventName: text('event_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const parentAdvisorTurns = pgTable('parent_advisor_turns', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id').notNull().references(() => parentAccounts.id),
  studentId: uuid('student_id').notNull().references(() => students.id),
  role: text('role').notNull(),
  ciphertext: text('ciphertext').notNull(),
  iv: text('iv').notNull(),
  authTag: text('auth_tag').notNull(),
  keyVersion: text('key_version').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [index('idx_parent_advisor_turns_parent_student_created').on(table.parentId, table.studentId, table.createdAt)]);

export const parentAdvisorRequests = pgTable('parent_advisor_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id').notNull().references(() => parentAccounts.id),
  studentId: uuid('student_id').notNull().references(() => students.id),
  idempotencyKey: text('idempotency_key').notNull(),
  requestHash: text('request_hash').notNull(),
  responseBody: jsonb('response_body'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true })
}, (table) => [unique('parent_advisor_requests_parent_student_key_unique').on(table.parentId, table.studentId, table.idempotencyKey)]);
