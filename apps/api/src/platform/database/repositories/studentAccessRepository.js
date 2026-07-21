import { and, desc, eq, gt, inArray, isNull } from 'drizzle-orm';
import { accessAuditEvents, studentDeviceSessions, studentInvitations, studentUnlockSessions, students } from '../schema/index.js';

export function createStudentAccessRepository(db) {
  return Object.freeze({
    async createInvitation(value) { return (await db.insert(studentInvitations).values(value).returning())[0]; },
    async findInvitation(tokenHash) { return (await db.select().from(studentInvitations).where(and(eq(studentInvitations.tokenHash, tokenHash), isNull(studentInvitations.usedAt), isNull(studentInvitations.revokedAt), gt(studentInvitations.expiresAt, new Date()))).limit(1))[0] ?? null; },
    async consumeInvitation(id) { return (await db.update(studentInvitations).set({ usedAt: new Date() }).where(and(eq(studentInvitations.id, id), isNull(studentInvitations.usedAt), isNull(studentInvitations.revokedAt))).returning())[0] ?? null; },
    revokeInvitation(id, householdId) { return db.update(studentInvitations).set({ revokedAt: new Date() }).where(and(eq(studentInvitations.id, id), eq(studentInvitations.householdId, householdId))); },
    listInvitations(studentId) { return db.select({ id: studentInvitations.id, destinationEmail: studentInvitations.destinationEmail, destinationType: studentInvitations.destinationType, expiresAt: studentInvitations.expiresAt, usedAt: studentInvitations.usedAt, revokedAt: studentInvitations.revokedAt, createdAt: studentInvitations.createdAt }).from(studentInvitations).where(eq(studentInvitations.studentId, studentId)).orderBy(desc(studentInvitations.createdAt)); },
    async createDevice(value) { return (await db.insert(studentDeviceSessions).values(value).returning())[0]; },
    async getDevicesByTokens(tokenHashes) { if (!tokenHashes.length) return []; return db.select({ id: studentDeviceSessions.id, householdId: studentDeviceSessions.householdId, studentId: studentDeviceSessions.studentId, name: students.name, grade: students.grade, pinHash: students.pinHash }).from(studentDeviceSessions).innerJoin(students, eq(students.id, studentDeviceSessions.studentId)).where(and(inArray(studentDeviceSessions.tokenHash, tokenHashes), isNull(studentDeviceSessions.revokedAt), gt(studentDeviceSessions.expiresAt, new Date()))); },
    listDevices(studentId) { return db.select({ id: studentDeviceSessions.id, deviceLabel: studentDeviceSessions.deviceLabel, lastAccessAt: studentDeviceSessions.lastAccessAt, expiresAt: studentDeviceSessions.expiresAt, revokedAt: studentDeviceSessions.revokedAt }).from(studentDeviceSessions).where(eq(studentDeviceSessions.studentId, studentId)).orderBy(desc(studentDeviceSessions.lastAccessAt)); },
    revokeDevice(id, householdId, studentId) { return db.update(studentDeviceSessions).set({ revokedAt: new Date() }).where(and(eq(studentDeviceSessions.id, id), eq(studentDeviceSessions.householdId, householdId), eq(studentDeviceSessions.studentId, studentId))); },
    revokeAllDevices(studentId, householdId) { return db.update(studentDeviceSessions).set({ revokedAt: new Date() }).where(and(eq(studentDeviceSessions.studentId, studentId), eq(studentDeviceSessions.householdId, householdId), isNull(studentDeviceSessions.revokedAt))); },
    updateDeviceAccess(id) { return db.update(studentDeviceSessions).set({ lastAccessAt: new Date() }).where(eq(studentDeviceSessions.id, id)); },
    async setPin(studentId, pinHash) { return (await db.update(students).set({ pinHash, pinUpdatedAt: new Date() }).where(eq(students.id, studentId)).returning())[0]; },
    async createUnlockSession(value) { return (await db.insert(studentUnlockSessions).values(value).returning())[0]; },
    getUnlockSessions(tokenHashes) { if (!tokenHashes.length) return []; return db.select().from(studentUnlockSessions).where(and(inArray(studentUnlockSessions.tokenHash, tokenHashes), isNull(studentUnlockSessions.revokedAt), gt(studentUnlockSessions.expiresAt, new Date()))); },
    revokeUnlockSessionsForStudent(studentId) { return db.update(studentUnlockSessions).set({ revokedAt: new Date() }).where(and(eq(studentUnlockSessions.studentId, studentId), isNull(studentUnlockSessions.revokedAt))); },
    revokeUnlockSessionsForDevice(deviceId) { return db.update(studentUnlockSessions).set({ revokedAt: new Date() }).where(and(eq(studentUnlockSessions.deviceId, deviceId), isNull(studentUnlockSessions.revokedAt))); },
    findStudent(studentId, householdId) { return db.select().from(students).where(and(eq(students.id, studentId), eq(students.householdId, householdId))).limit(1).then((rows) => rows[0] ?? null); },
    addAudit(value) { return db.insert(accessAuditEvents).values(value); },
    listAudit(householdId) { return db.select().from(accessAuditEvents).where(eq(accessAuditEvents.householdId, householdId)).orderBy(desc(accessAuditEvents.createdAt)).limit(50); }
  });
}
