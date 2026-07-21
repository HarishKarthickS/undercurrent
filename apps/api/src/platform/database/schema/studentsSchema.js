import { boolean, index, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { households } from './identitySchema.js';

export const consentStatus = pgEnum('consent_status', ['pending', 'granted', 'withdrawn', 'expired']);

export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id),
  name: text('name').notNull(),
  grade: text('grade').notNull(),
  routineMorning: text('routine_morning'),
  routineEvening: text('routine_evening'),
  pinHash: text('pin_hash'),
  pinUpdatedAt: timestamp('pin_updated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [index('idx_students_household').on(table.householdId, table.id)]);

export const consentRecords = pgTable('consent_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id),
  studentId: uuid('student_id').notNull().references(() => students.id),
  purpose: text('purpose').notNull(),
  noticeVersion: text('notice_version').notNull(),
  status: consentStatus('status').notNull(),
  verificationReference: text('verification_reference'),
  grantedAt: timestamp('granted_at', { withTimezone: true }),
  withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  collectionBasis: text('collection_basis').notNull().default('demo_terms_acknowledgement'),
  termsVersion: text('terms_version'),
  termsSha256: text('terms_sha256'),
  acceptedByParentId: uuid('accepted_by_parent_id'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [unique('consent_student_purpose_unique').on(table.studentId, table.purpose), index('idx_consent_student_purpose_status').on(table.studentId, table.purpose, table.status)]);

export const studentRitualSettings = pgTable('student_ritual_settings', {
  studentId: uuid('student_id').primaryKey().references(() => students.id),
  morningStartHour: integer('morning_start_hour').notNull().default(5), eveningStartHour: integer('evening_start_hour').notNull().default(16), dailySessionLimit: integer('daily_session_limit').notNull().default(2),
  voiceEnabled: boolean('voice_enabled').notNull().default(true), activityEnabled: boolean('activity_enabled').notNull().default(true), preferredStyle: text('preferred_style').notNull().default('adaptive'), morningAiEnabled: boolean('morning_ai_enabled').notNull().default(false), morningPaths: text('morning_paths').notNull().default('energy,ready,calm,curiosity,reflect'), morningSensitivity: text('morning_sensitivity').notNull().default('standard'), experienceBandOverride: text('experience_band_override'), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const studentInvitations = pgTable('student_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id),
  studentId: uuid('student_id').notNull().references(() => students.id),
  destinationEmail: text('destination_email').notNull(),
  destinationType: text('destination_type').notNull(),
  parentConfirmedStudentEmail: boolean('parent_confirmed_student_email').notNull().default(false),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [index('idx_student_invitations_token').on(table.tokenHash), index('idx_student_invitations_student').on(table.studentId, table.createdAt)]);

export const studentDeviceSessions = pgTable('student_device_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id),
  studentId: uuid('student_id').notNull().references(() => students.id),
  tokenHash: text('token_hash').notNull(),
  deviceLabel: text('device_label').notNull().default('This device'),
  lastAccessAt: timestamp('last_access_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [unique('student_device_token_unique').on(table.tokenHash), index('idx_student_devices_student').on(table.studentId, table.lastAccessAt)]);

export const studentUnlockSessions = pgTable('student_unlock_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  deviceId: uuid('device_id').notNull().references(() => studentDeviceSessions.id),
  studentId: uuid('student_id').notNull().references(() => students.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [index('idx_student_unlock_student_expiry').on(table.studentId, table.expiresAt)]);

export const accessAuditEvents = pgTable('access_audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id),
  studentId: uuid('student_id').references(() => students.id),
  actorType: text('actor_type').notNull(),
  eventType: text('event_type').notNull(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [index('idx_access_audit_household_created').on(table.householdId, table.createdAt)]);
