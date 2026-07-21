import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { accessAuditEvents, consentRecords, morningRippleEntries, parentChildPreferences, safetyEvents, scores, sessionRecaps, sessionTurns, sessions, studentDeviceSessions, studentRitualSettings, studentUnlockSessions, students, topics, turnRequests, wins } from '../schema/index.js';

const rowsFor = async (tx, studentId) => tx.select().from(sessions).where(eq(sessions.studentId, studentId));
const ids = (rows) => rows.map((row) => row.id);

export function createPrivacyRepository(db) {
  async function assertStudent(tx, householdId, studentId) {
    return (await tx.select().from(students).where(and(eq(students.id, studentId), eq(students.householdId, householdId))).limit(1))[0] ?? null;
  }
  const repository = {
    async withdrawStudent({ householdId, studentId }) {
      return db.transaction(async (tx) => {
        const student = await assertStudent(tx, householdId, studentId);
        if (!student) return null;
        const now = new Date();
        await tx.update(consentRecords).set({ status: 'withdrawn', withdrawnAt: now, updatedAt: now }).where(eq(consentRecords.studentId, studentId));
        await tx.update(studentDeviceSessions).set({ revokedAt: now }).where(eq(studentDeviceSessions.studentId, studentId));
        await tx.update(studentUnlockSessions).set({ revokedAt: now }).where(eq(studentUnlockSessions.studentId, studentId));
        await tx.update(sessions).set({ endedAt: now, endReason: 'consent_withdrawn' }).where(and(eq(sessions.studentId, studentId), isNull(sessions.endedAt)));
        return student;
      });
    },
    async exportStudent({ householdId, studentId }) {
      const student = await assertStudent(db, householdId, studentId);
      if (!student) return null;
      const sessionRows = await rowsFor(db, studentId); const sessionIds = ids(sessionRows);
      const topicRows = await db.select().from(topics).where(eq(topics.studentId, studentId));
      return {
        student,
        consent: await db.select().from(consentRecords).where(eq(consentRecords.studentId, studentId)),
        sessions: sessionRows,
        turns: sessionIds.length ? await db.select().from(sessionTurns).where(inArray(sessionTurns.sessionId, sessionIds)) : [],
        recaps: await db.select().from(sessionRecaps).where(eq(sessionRecaps.studentId, studentId)),
        morningRipples: await db.select().from(morningRippleEntries).where(eq(morningRippleEntries.studentId, studentId)),
        topics: topicRows,
        scores: topicRows.length ? await db.select().from(scores).where(inArray(scores.topicId, ids(topicRows))) : [],
        wins: await db.select().from(wins).where(eq(wins.studentId, studentId)),
        safetyEvents: await db.select().from(safetyEvents).where(eq(safetyEvents.studentId, studentId)),
        devices: await db.select().from(studentDeviceSessions).where(eq(studentDeviceSessions.studentId, studentId)),
        accessAudit: await db.select().from(accessAuditEvents).where(eq(accessAuditEvents.studentId, studentId)),
        ritualSettings: await db.select().from(studentRitualSettings).where(eq(studentRitualSettings.studentId, studentId)),
        parentPreferences: await db.select().from(parentChildPreferences).where(eq(parentChildPreferences.studentId, studentId))
      };
    },
    async deleteStudent({ householdId, studentId }) {
      return db.transaction(async (tx) => {
        const student = await assertStudent(tx, householdId, studentId);
        if (!student) return null;
        const sessionRows = await rowsFor(tx, studentId); const sessionIds = ids(sessionRows);
        const topicRows = await tx.select().from(topics).where(eq(topics.studentId, studentId));
        if (sessionIds.length) {
          await tx.delete(turnRequests).where(inArray(turnRequests.sessionId, sessionIds));
          await tx.delete(sessionTurns).where(inArray(sessionTurns.sessionId, sessionIds));
          await tx.delete(sessionRecaps).where(inArray(sessionRecaps.sessionId, sessionIds));
          await tx.delete(morningRippleEntries).where(inArray(morningRippleEntries.sessionId, sessionIds));
          await tx.delete(scores).where(inArray(scores.sessionId, sessionIds));
          await tx.delete(safetyEvents).where(inArray(safetyEvents.sessionId, sessionIds));
        }
        if (topicRows.length) await tx.delete(scores).where(inArray(scores.topicId, ids(topicRows)));
        await tx.delete(studentUnlockSessions).where(eq(studentUnlockSessions.studentId, studentId));
        await tx.delete(studentDeviceSessions).where(eq(studentDeviceSessions.studentId, studentId));
        await tx.delete(accessAuditEvents).where(eq(accessAuditEvents.studentId, studentId));
        await tx.delete(safetyEvents).where(eq(safetyEvents.studentId, studentId));
        await tx.delete(wins).where(eq(wins.studentId, studentId));
        await tx.delete(topics).where(eq(topics.studentId, studentId));
        await tx.delete(parentChildPreferences).where(eq(parentChildPreferences.studentId, studentId));
        await tx.delete(studentRitualSettings).where(eq(studentRitualSettings.studentId, studentId));
        await tx.delete(consentRecords).where(eq(consentRecords.studentId, studentId));
        await tx.delete(sessions).where(eq(sessions.studentId, studentId));
        await tx.delete(students).where(and(eq(students.id, studentId), eq(students.householdId, householdId)));
        return student;
      });
    },
    async listPurgeCandidates() {
      const result = await db.execute(sql`
        SELECT s.id, s.household_id
        FROM students s
        LEFT JOIN consent_records c ON c.student_id = s.id AND c.purpose = 'learning_companion'
        LEFT JOIN sessions se ON se.student_id = s.id
        GROUP BY s.id, s.household_id, c.status, c.withdrawn_at, s.created_at
        HAVING c.status = 'withdrawn'
          OR COALESCE(MAX(se.started_at), s.created_at) < NOW() - INTERVAL '30 days'
      `);
      return result.rows;
    },
    async purgeDueStudents() {
      const candidates = await repository.listPurgeCandidates();
      for (const candidate of candidates) await repository.deleteStudent({ householdId: candidate.household_id, studentId: candidate.id });
      return candidates.length;
    }
  };
  return Object.freeze(repository);
}
