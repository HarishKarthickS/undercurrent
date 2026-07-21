import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { householdTermsAcceptances, households, parentAccounts, parentInvitations, parentSessions } from '../schema/index.js';

const LOCAL_HOUSEHOLD_ID = '00000000-0000-0000-0000-000000000001';
const LOCAL_PARENT_ID = '00000000-0000-0000-0000-000000000002';

export function createIdentityRepository(db) {
  async function ensureLocalParent() {
    await db.insert(households).values({ id: LOCAL_HOUSEHOLD_ID, name: 'Local demo household' }).onConflictDoNothing();
    await db.insert(parentAccounts).values({ id: LOCAL_PARENT_ID, householdId: LOCAL_HOUSEHOLD_ID, displayName: 'Local parent', email: 'local-parent@example.invalid' }).onConflictDoNothing();
    return { id: LOCAL_PARENT_ID, householdId: LOCAL_HOUSEHOLD_ID, displayName: 'Local parent' };
  }
  return Object.freeze({
    ensureLocalParent,
    async createParentSession({ tokenHash, expiresAt }) {
      const parent = await ensureLocalParent();
      await db.insert(parentSessions).values({ tokenHash, parentId: parent.id, householdId: parent.householdId, expiresAt });
      return parent;
    },
    async createSessionForParent({ parentId, householdId, tokenHash, expiresAt, deviceLabel = null, ipHash = null }) {
      await db.insert(parentSessions).values({ tokenHash, parentId, householdId, expiresAt, deviceLabel, ipHash });
      return (await db.select().from(parentAccounts).where(eq(parentAccounts.id, parentId)).limit(1))[0];
    },
    deleteParentSession(tokenHash) { return db.delete(parentSessions).where(eq(parentSessions.tokenHash, tokenHash)); },
    revokeParentSession(tokenHash) { return db.update(parentSessions).set({ revokedAt: new Date() }).where(eq(parentSessions.tokenHash, tokenHash)); },
    revokeAllParentSessions(parentId) { return db.update(parentSessions).set({ revokedAt: new Date() }).where(and(eq(parentSessions.parentId, parentId), isNull(parentSessions.revokedAt))); },
    listParentSessions(parentId) { return db.select({ id: parentSessions.id, createdAt: parentSessions.createdAt, lastSeenAt: parentSessions.lastSeenAt, expiresAt: parentSessions.expiresAt, deviceLabel: parentSessions.deviceLabel }).from(parentSessions).where(and(eq(parentSessions.parentId, parentId), isNull(parentSessions.revokedAt), gt(parentSessions.expiresAt, new Date()))).orderBy(desc(parentSessions.lastSeenAt)); },
    touchParentSession(tokenHash) { return db.update(parentSessions).set({ lastSeenAt: new Date() }).where(eq(parentSessions.tokenHash, tokenHash)); },
    async findParentByEmail(email) { return (await db.select().from(parentAccounts).where(eq(parentAccounts.email, email.toLowerCase())).limit(1))[0] ?? null; },
    async findParentByHousehold(householdId) { return (await db.select().from(parentAccounts).where(eq(parentAccounts.householdId, householdId)).limit(1))[0] ?? null; },
    async createAccount({ displayName, email, passwordHash, verificationTokenHash, verificationTokenExpiresAt }) {
      return db.transaction(async (tx) => {
        const [household] = await tx.insert(households).values({ name: `${displayName}'s household` }).returning();
        return (await tx.insert(parentAccounts).values({ householdId: household.id, displayName, email: email.toLowerCase(), passwordHash, verificationTokenHash, verificationTokenExpiresAt }).returning())[0];
      });
    },
    async findUsableInvitation({ tokenHash, email }) {
      return (await db.select().from(parentInvitations).where(and(eq(parentInvitations.tokenHash, tokenHash), eq(parentInvitations.email, email.toLowerCase()), isNull(parentInvitations.usedAt), isNull(parentInvitations.revokedAt), gt(parentInvitations.expiresAt, new Date()))).limit(1))[0] ?? null;
    },
    async createAccountFromInvitation({ invitation, displayName, email, passwordHash, verificationTokenHash, verificationTokenExpiresAt }) {
      return db.transaction(async (tx) => {
        const used = await tx.update(parentInvitations).set({ usedAt: new Date() }).where(and(eq(parentInvitations.id, invitation.id), isNull(parentInvitations.usedAt), isNull(parentInvitations.revokedAt))).returning();
        if (!used[0]) return null;
        return (await tx.insert(parentAccounts).values({ householdId: invitation.householdId, role: invitation.role, displayName, email: email.toLowerCase(), passwordHash, verificationTokenHash, verificationTokenExpiresAt }).returning())[0];
      });
    },
    async createParentInvitation({ householdId, email, role, tokenHash, expiresAt, createdByParentId }) { return (await db.insert(parentInvitations).values({ householdId, email: email.toLowerCase(), role, tokenHash, expiresAt, createdByParentId }).returning())[0]; },
    listParentInvitations(householdId) { return db.select({ id: parentInvitations.id, email: parentInvitations.email, role: parentInvitations.role, expiresAt: parentInvitations.expiresAt, usedAt: parentInvitations.usedAt, revokedAt: parentInvitations.revokedAt, createdAt: parentInvitations.createdAt }).from(parentInvitations).where(eq(parentInvitations.householdId, householdId)).orderBy(desc(parentInvitations.createdAt)); },
    async acceptTerms({ householdId, parentId, termsVersion, termsSha256 }) { return (await db.insert(householdTermsAcceptances).values({ householdId, parentId, termsVersion, termsSha256 }).onConflictDoUpdate({ target: [householdTermsAcceptances.parentId, householdTermsAcceptances.termsVersion], set: { termsSha256, acceptedAt: new Date(), revokedAt: null } }).returning())[0]; },
    async hasActiveTerms(householdId) { return Boolean((await db.select({ id: householdTermsAcceptances.id }).from(householdTermsAcceptances).where(and(eq(householdTermsAcceptances.householdId, householdId), isNull(householdTermsAcceptances.revokedAt))).limit(1))[0]); },
    revokeTerms(householdId) { return db.update(householdTermsAcceptances).set({ revokedAt: new Date() }).where(and(eq(householdTermsAcceptances.householdId, householdId), isNull(householdTermsAcceptances.revokedAt))); },
    async verifyEmail({ id, tokenHash }) { return (await db.update(parentAccounts).set({ emailVerifiedAt: new Date(), verificationTokenHash: null, verificationTokenExpiresAt: null }).where(and(eq(parentAccounts.id, id), eq(parentAccounts.verificationTokenHash, tokenHash), gt(parentAccounts.verificationTokenExpiresAt, new Date()))).returning())[0] ?? null; },
    async setVerificationToken({ id, tokenHash, expiresAt }) { await db.update(parentAccounts).set({ verificationTokenHash: tokenHash, verificationTokenExpiresAt: expiresAt }).where(eq(parentAccounts.id, id)); },
    async setPasswordResetToken({ id, tokenHash, expiresAt }) { await db.update(parentAccounts).set({ passwordResetTokenHash: tokenHash, passwordResetTokenExpiresAt: expiresAt }).where(eq(parentAccounts.id, id)); },
    async resetPassword({ tokenHash, passwordHash }) { return (await db.update(parentAccounts).set({ passwordHash, passwordResetTokenHash: null, passwordResetTokenExpiresAt: null }).where(and(eq(parentAccounts.passwordResetTokenHash, tokenHash), gt(parentAccounts.passwordResetTokenExpiresAt, new Date()))).returning())[0] ?? null; },
    async findParentSession(tokenHash) {
      const rows = await db.select({ parent_id: parentSessions.parentId, household_id: parentSessions.householdId, expires_at: parentSessions.expiresAt, display_name: parentAccounts.displayName, email: parentAccounts.email, role: parentAccounts.role })
        .from(parentSessions).innerJoin(parentAccounts, eq(parentAccounts.id, parentSessions.parentId))
        .where(and(eq(parentSessions.tokenHash, tokenHash), isNull(parentSessions.revokedAt), gt(parentSessions.expiresAt, new Date()))).limit(1);
      return rows[0] ?? null;
    }
  });
}
