import { AppError } from '#api/shared/errors/appError.js';
import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';

const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const token = (prefix) => `${prefix}_${randomBytes(32).toString('base64url')}`;
const parentView = (parent) => ({ id: parent.id, displayName: parent.displayName ?? parent.display_name, email: parent.email, role: parent.role });

export function createIdentityService({ repositories, mailer, config }) {
  const issueSession = async (parent) => {
    const sessionToken = token('parent');
    const expiresAt = new Date(Date.now() + 43_200_000);
    await repositories.createSessionForParent({ parentId: parent.id, householdId: parent.householdId ?? parent.household_id, tokenHash: hashToken(sessionToken), expiresAt });
    return { token: sessionToken, expiresAt, parent: parentView(parent), household: { id: parent.householdId ?? parent.household_id, name: 'Household' } };
  };

  return Object.freeze({
    async signup({ displayName, email, password, invitationToken }) {
      if (!displayName?.trim() || !/^\S+@\S+\.\S+$/.test(email ?? '') || (password?.length ?? 0) < 12 || !invitationToken?.trim()) throw new AppError(400, 'VALIDATION_ERROR', 'Use an invitation, your name, a valid email address, and a password of at least 12 characters.');
      if (await repositories.findParentByEmail(email)) throw new AppError(409, 'EMAIL_IN_USE', 'An account already uses that email address. Sign in or reset its password.');
      const invitation = await repositories.findUsableInvitation({ tokenHash: hashToken(invitationToken), email });
      if (!invitation) throw new AppError(403, 'INVITATION_REQUIRED', 'Use a valid closed-demo invitation for this email address.');
      const verificationToken = token('verify');
      const parent = await repositories.createAccountFromInvitation({ invitation, displayName: displayName.trim(), email, passwordHash: await argon2.hash(password, { type: argon2.argon2id }), verificationTokenHash: hashToken(verificationToken), verificationTokenExpiresAt: new Date(Date.now() + 86_400_000) });
      if (!parent) throw new AppError(409, 'INVITATION_USED', 'This invitation has already been used.');
      await mailer.sendParentVerification({ parent, token: verificationToken });
      return { accepted: true };
    },
    async verifyEmail({ parentId, token: verificationToken }) {
      const parent = await repositories.verifyEmail({ id: parentId, tokenHash: hashToken(verificationToken ?? '') });
      if (!parent) throw new AppError(400, 'INVALID_TOKEN', 'This verification link is invalid, expired, or has already been used.');
      return issueSession(parent);
    },
    async resendVerification({ email }) {
      const parent = await repositories.findParentByEmail(email ?? '');
      if (parent && !parent.emailVerifiedAt) {
        const verificationToken = token('verify');
        await repositories.setVerificationToken({ id: parent.id, tokenHash: hashToken(verificationToken), expiresAt: new Date(Date.now() + 86_400_000) });
        await mailer.sendParentVerification({ parent, token: verificationToken });
      }
      return { accepted: true };
    },
    async login({ email, password }) {
      const parent = await repositories.findParentByEmail(email ?? '');
      if (!parent || !parent.passwordHash || !(await argon2.verify(parent.passwordHash, password ?? ''))) throw new AppError(401, 'INVALID_LOGIN', 'Email or password is incorrect.');
      if (!parent.emailVerifiedAt) throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email before signing in.');
      return issueSession(parent);
    },
    async requestPasswordReset({ email }) {
      const parent = await repositories.findParentByEmail(email ?? '');
      if (parent?.emailVerifiedAt) {
        const resetToken = token('reset');
        await repositories.setPasswordResetToken({ id: parent.id, tokenHash: hashToken(resetToken), expiresAt: new Date(Date.now() + 1_800_000) });
        await mailer.sendPasswordReset({ parent, token: resetToken });
      }
      return { accepted: true };
    },
    async resetPassword({ token: resetToken, password }) {
      if ((password?.length ?? 0) < 12) throw new AppError(400, 'VALIDATION_ERROR', 'Use a password of at least 12 characters.');
      const parent = await repositories.resetPassword({ tokenHash: hashToken(resetToken ?? ''), passwordHash: await argon2.hash(password, { type: argon2.argon2id }) });
      if (!parent) throw new AppError(400, 'INVALID_TOKEN', 'This password-reset link is invalid, expired, or has already been used.');
      await repositories.revokeAllParentSessions(parent.id);
      return { accepted: true };
    },
    async session(tokenValue) {
      if (!tokenValue) return null;
      const session = await repositories.findParentSession(hashToken(tokenValue));
      return session ? { parent: { id: session.parent_id, displayName: session.display_name, email: session.email, role: session.role }, household: { id: session.household_id } } : null;
    },
    async logout(tokenValue) { if (tokenValue) await repositories.revokeParentSession(hashToken(tokenValue)); },
    async requireParent(request) {
      const sessionToken = request.cookies?.parent_session;
      if (!sessionToken) throw new AppError(401, 'PARENT_AUTH_REQUIRED', 'Sign in to access the parent control center.');
      const session = await repositories.findParentSession(hashToken(sessionToken));
      if (!session) throw new AppError(401, 'PARENT_AUTH_REQUIRED', 'Your parent session has expired. Please sign in again.');
      await repositories.touchParentSession(hashToken(sessionToken));
      return session;
    },
    async acceptDemoTerms(parent, { accepted }) {
      if (accepted !== true) throw new AppError(400, 'TERMS_REQUIRED', 'Accept the closed-demo terms before collecting child data.');
      return repositories.acceptTerms({ householdId: parent.household_id, parentId: parent.parent_id ?? parent.id, termsVersion: config.demoTermsVersion, termsSha256: config.demoTermsSha256 });
    },
    async inviteGuardian(parent, { email, role = 'guardian' }) {
      if (parent.role !== 'owner') throw new AppError(403, 'OWNER_REQUIRED', 'Only the household owner can invite a guardian.');
      if (!/^\S+@\S+\.\S+$/.test(email ?? '') || !['owner', 'guardian'].includes(role)) throw new AppError(400, 'VALIDATION_ERROR', 'Enter a valid guardian email and role.');
      const rawToken = token('guardian_invite');
      const invitation = await repositories.createParentInvitation({ householdId: parent.household_id, email, role, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 7 * 86_400_000), createdByParentId: parent.parent_id ?? parent.id });
      await mailer.sendGuardianInvitation?.({ email, token: rawToken, role });
      return { invitation: { id: invitation.id, email: invitation.email, role: invitation.role, expiresAt: invitation.expiresAt } };
    },
    async listGuardianInvitations(parent) {
      if (parent.role !== 'owner') throw new AppError(403, 'OWNER_REQUIRED', 'Only the household owner can view guardian invitations.');
      return { invitations: await repositories.listParentInvitations(parent.household_id) };
    },
    async listSessions(parent) { return { sessions: await repositories.listParentSessions(parent.parent_id ?? parent.id) }; },
    async revokeAllSessions(parent) { await repositories.revokeAllParentSessions(parent.parent_id ?? parent.id); return { accepted: true }; }
  });
}
