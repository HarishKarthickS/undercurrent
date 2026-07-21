import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { AppError } from '#api/shared/errors/appError.js';

const hash = (value) => createHash('sha256').update(value).digest('hex');
const createToken = () => `student_device_${randomBytes(32).toString('base64url')}`;

export function createStudentAccessService({ repositories, mailer }) {
  async function parentStudent(parent, studentId) {
    const student = await repositories.canAccessStudent({ householdId: parent.household_id, studentId });
    if (!student) throw new AppError(404, 'STUDENT_NOT_FOUND', 'That student profile is not available in this household.');
    return student;
  }
  async function deviceStudent(tokens, studentId) {
    const device = (await repositories.getStudentDevices(tokens.map(hash))).find((item) => item.studentId === studentId);
    if (!device) throw new AppError(401, 'STUDENT_DEVICE_REQUIRED', 'Use a parent-approved student device to continue.');
    return device;
  }
  async function unlockedDevice(tokens, unlockTokens, studentId) {
    const device = await deviceStudent(tokens, studentId);
    const unlocked = (await repositories.getStudentUnlockSessions(unlockTokens.map(hash))).some((item) => item.deviceId === device.id && item.studentId === studentId);
    if (!unlocked) throw new AppError(401, 'STUDENT_UNLOCK_REQUIRED', 'Enter this student PIN to continue.');
    return device;
  }
  async function issueUnlock(device, studentId) {
    await repositories.revokeStudentUnlockSessionsForDevice(device.id);
    const rawToken = createToken();
    await repositories.createStudentUnlockSession({ tokenHash: hash(rawToken), deviceId: device.id, studentId, expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) });
    return rawToken;
  }

  return Object.freeze({
    async invite(parent, body) {
      const { studentId, destinationEmail, destinationType = 'parent', parentConfirmedStudentEmail = false } = body ?? {};
      const student = await parentStudent(parent, studentId);
      const email = (destinationType === 'parent' ? parent.email : destinationEmail)?.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email ?? '')) throw new AppError(400, 'VALIDATION_ERROR', 'Enter a valid invitation email address.');
      if (destinationType !== 'parent' && destinationType !== 'student') throw new AppError(400, 'VALIDATION_ERROR', 'Choose a parent or parent-approved student email destination.');
      if (destinationType === 'student' && parentConfirmedStudentEmail !== true) throw new AppError(400, 'CONSENT_REQUIRED', 'Confirm that you are authorized to use this student email address.');
      const rawToken = createToken();
      const invitation = await repositories.createStudentInvitation({ householdId: parent.household_id, studentId, destinationEmail: email, destinationType, parentConfirmedStudentEmail, tokenHash: hash(rawToken), expiresAt: new Date(Date.now() + 86_400_000) });
      await mailer.sendStudentInvitation({ student, destinationEmail: email, token: rawToken });
      await repositories.addAccessAudit({ householdId: parent.household_id, studentId, actorType: 'parent', eventType: 'student_invitation_sent', metadata: destinationType });
      return { invitation: { id: invitation.id, expiresAt: invitation.expiresAt, destinationEmail: email, destinationType } };
    },
    async consumeInvitation(rawToken, deviceLabel) {
      const invitation = await repositories.findStudentInvitation(hash(rawToken ?? ''));
      if (!invitation) throw new AppError(400, 'INVALID_INVITATION', 'This invitation is invalid, expired, revoked, or already used.');
      const consumed = await repositories.consumeStudentInvitation(invitation.id);
      if (!consumed) throw new AppError(400, 'INVALID_INVITATION', 'This invitation is no longer available.');
      const rawDeviceToken = createToken();
      await repositories.createStudentDevice({ householdId: invitation.householdId, studentId: invitation.studentId, tokenHash: hash(rawDeviceToken), deviceLabel: deviceLabel?.trim().slice(0, 80) || 'This device', expiresAt: new Date(Date.now() + 31_536_000_000) });
      await repositories.addAccessAudit({ householdId: invitation.householdId, studentId: invitation.studentId, actorType: 'student_device', eventType: 'student_device_authorized' });
      return { deviceToken: rawDeviceToken, studentId: invitation.studentId };
    },
    async localProfiles(tokens) { return (await repositories.getStudentDevices(tokens.map(hash))).map(({ studentId, name, grade, pinHash }) => ({ id: studentId, name, grade, pinSet: Boolean(pinHash) })); },
    async setPin(tokens, { studentId, pin }) {
      if (!/^\d{4,8}$/.test(pin ?? '')) throw new AppError(400, 'VALIDATION_ERROR', 'Choose a 4 to 8 digit PIN.');
      const device = await deviceStudent(tokens, studentId);
      await repositories.setStudentPin(studentId, await argon2.hash(pin, { type: argon2.argon2id }));
      await repositories.updateStudentDeviceAccess(device.id);
      await repositories.addAccessAudit({ householdId: device.householdId, studentId, actorType: 'student_device', eventType: 'student_pin_set' });
      return { accepted: true, unlockToken: await issueUnlock(device, studentId) };
    },
    async unlock(tokens, { studentId, pin }) {
      const device = await deviceStudent(tokens, studentId);
      if (!device.pinHash || !(await argon2.verify(device.pinHash, pin ?? ''))) throw new AppError(401, 'INVALID_PIN', 'That PIN does not match this student profile.');
      await repositories.updateStudentDeviceAccess(device.id);
      await repositories.addAccessAudit({ householdId: device.householdId, studentId, actorType: 'student_device', eventType: 'student_unlocked' });
      return { student: { id: device.studentId, name: device.name, grade: device.grade }, unlockToken: await issueUnlock(device, studentId) };
    },
    async studentActor(tokens, unlockTokens, studentId) { const device = await unlockedDevice(tokens, unlockTokens, studentId); return { household_id: device.householdId, student_id: device.studentId }; },
    async studentActorForSession(tokens, unlockTokens, sessionId) { const session = await repositories.getSession(sessionId); if (!session) throw new AppError(404, 'SESSION_NOT_FOUND', 'Choose a valid learning session.'); return unlockedDevice(tokens, unlockTokens, session.studentId ?? session.student_id).then((device) => ({ household_id: device.householdId, student_id: device.studentId })); },
    async access(parent, studentId) { await parentStudent(parent, studentId); return { invitations: await repositories.listStudentInvitations(studentId), devices: await repositories.listStudentDevices(studentId), audit: await repositories.listAccessAudit(parent.household_id) }; },
    async resetPin(parent, studentId) { await parentStudent(parent, studentId); await repositories.setStudentPin(studentId, null); await repositories.revokeAllStudentDevices(studentId, parent.household_id); await repositories.revokeStudentUnlockSessionsForStudent(studentId); await repositories.addAccessAudit({ householdId: parent.household_id, studentId, actorType: 'parent', eventType: 'student_pin_reset' }); return { accepted: true }; },
    async revokeDevice(parent, studentId, deviceId) { await parentStudent(parent, studentId); await repositories.revokeStudentDevice(deviceId, parent.household_id, studentId); await repositories.revokeStudentUnlockSessionsForDevice(deviceId); await repositories.addAccessAudit({ householdId: parent.household_id, studentId, actorType: 'parent', eventType: 'student_device_revoked' }); return { accepted: true }; },
    async revokeAll(parent, studentId) { await parentStudent(parent, studentId); await repositories.revokeAllStudentDevices(studentId, parent.household_id); await repositories.revokeStudentUnlockSessionsForStudent(studentId); await repositories.addAccessAudit({ householdId: parent.household_id, studentId, actorType: 'parent', eventType: 'student_devices_revoked' }); return { accepted: true }; }
  });
}
