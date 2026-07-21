import { index, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

export const guardianRole = pgEnum('guardian_role', ['owner', 'guardian']);

export const households = pgTable('households', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  timeZone: text('time_zone').notNull().default('UTC'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const parentAccounts = pgTable('parent_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id),
  role: guardianRole('role').notNull().default('owner'),
  displayName: text('display_name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash'),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  verificationTokenHash: text('verification_token_hash'),
  verificationTokenExpiresAt: timestamp('verification_token_expires_at', { withTimezone: true }),
  magicTokenHash: text('magic_token_hash'),
  magicTokenExpiresAt: timestamp('magic_token_expires_at', { withTimezone: true }),
  passwordResetTokenHash: text('password_reset_token_hash'),
  passwordResetTokenExpiresAt: timestamp('password_reset_token_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [unique('parent_accounts_email_unique').on(table.email), index('idx_parent_accounts_email').on(table.email)]);

export const parentSessions = pgTable('parent_sessions', {
  id: uuid('id').defaultRandom().notNull().unique(),
  tokenHash: text('token_hash').primaryKey(),
  parentId: uuid('parent_id').notNull().references(() => parentAccounts.id),
  householdId: uuid('household_id').notNull().references(() => households.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  deviceLabel: text('device_label'),
  ipHash: text('ip_hash'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
}, (table) => [index('idx_parent_sessions_expiry').on(table.expiresAt)]);

export const parentInvitations = pgTable('parent_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id),
  email: text('email').notNull(),
  role: guardianRole('role').notNull().default('guardian'),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdByParentId: uuid('created_by_parent_id').references(() => parentAccounts.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [index('idx_parent_invitations_email').on(table.email, table.createdAt)]);

export const householdTermsAcceptances = pgTable('household_terms_acceptances', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id),
  parentId: uuid('parent_id').notNull().references(() => parentAccounts.id),
  termsVersion: text('terms_version').notNull(),
  termsSha256: text('terms_sha256').notNull(),
  collectionBasis: text('collection_basis').notNull().default('demo_terms_acknowledgement'),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true })
}, (table) => [unique('household_terms_parent_version_unique').on(table.parentId, table.termsVersion), index('idx_household_terms_household').on(table.householdId, table.acceptedAt)]);
