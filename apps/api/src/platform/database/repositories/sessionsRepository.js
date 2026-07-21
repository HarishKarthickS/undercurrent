import { and, asc, count, desc, eq, gte, inArray, isNull, lt, ne, or } from 'drizzle-orm';
import { morningRippleEntries, sessionRecaps, sessionTurns, sessions, studentRitualSettings, students, turnRequests } from '../schema/index.js';

export function createSessionsRepository(db) {
  return Object.freeze({
    async createSession({ studentId, type, questId = null, questStep = null }) { return (await db.insert(sessions).values({ studentId, type, questId, questStep }).returning())[0]; },
    async getSession(id) { return (await db.select().from(sessions).where(eq(sessions.id, id)).limit(1))[0] ?? null; },
    async endSession(id, reason) { return (await db.update(sessions).set({ endedAt: new Date(), endReason: reason }).where(eq(sessions.id, id)).returning())[0] ?? null; },
    listCompletedSessions(studentId, { from, to }) { return db.select({ endedAt: sessions.endedAt }).from(sessions).where(and(eq(sessions.studentId, studentId), gte(sessions.endedAt, from), lt(sessions.endedAt, to), inArray(sessions.endReason, ['child_exit', 'completed', 'session_cap']))); },
    listParentConversations(studentId) { return db.select({ id: sessions.id, type: sessions.type, questId: sessions.questId, startedAt: sessions.startedAt, endedAt: sessions.endedAt, endReason: sessions.endReason, turnCount: sessions.turnCount }).from(sessions).where(and(eq(sessions.studentId, studentId), or(ne(sessions.endReason, 'safety'), isNull(sessions.endReason)))).orderBy(desc(sessions.startedAt)); },
    async updateProgress(id, { turnCount, scaffoldStage, questStep = null }) { return (await db.update(sessions).set({ turnCount, scaffoldStage, ...(questStep ? { questStep } : {}) }).where(eq(sessions.id, id)).returning())[0] ?? null; },
    async addTurn(value) { return (await db.insert(sessionTurns).values(value).returning())[0]; },
    async getTurnRequest(sessionId, idempotencyKey) { return (await db.select().from(turnRequests).where(and(eq(turnRequests.sessionId, sessionId), eq(turnRequests.idempotencyKey, idempotencyKey))).limit(1))[0] ?? null; },
    async createTurnRequest(value) { return (await db.insert(turnRequests).values(value).onConflictDoNothing().returning())[0] ?? null; },
    async countHouseholdTurnRequests(householdId, from, to) { const [row] = await db.select({ total: count() }).from(turnRequests).innerJoin(sessions, eq(sessions.id, turnRequests.sessionId)).innerJoin(students, eq(students.id, sessions.studentId)).where(and(eq(students.householdId, householdId), gte(turnRequests.createdAt, from), lt(turnRequests.createdAt, to))); return Number(row?.total ?? 0); },
    async completeTurnRequest(id, responseBody) { return (await db.update(turnRequests).set({ responseStatus: 200, responseBody, completedAt: new Date() }).where(eq(turnRequests.id, id)).returning())[0] ?? null; },
    async removeTurnRequest(id) { await db.delete(turnRequests).where(eq(turnRequests.id, id)); },
    listTurns(sessionId) { return db.select().from(sessionTurns).where(eq(sessionTurns.sessionId, sessionId)).orderBy(asc(sessionTurns.createdAt)); },
    async getRitualSettings(studentId) { return (await db.select().from(studentRitualSettings).where(eq(studentRitualSettings.studentId, studentId)).limit(1))[0] ?? null; },
    async saveRitualSettings(studentId, values) { return (await db.insert(studentRitualSettings).values({ studentId, ...values, updatedAt: new Date() }).onConflictDoUpdate({ target: studentRitualSettings.studentId, set: { ...values, updatedAt: new Date() } }).returning())[0]; },
    async createRecap(values) { return (await db.insert(sessionRecaps).values(values).onConflictDoNothing().returning())[0] ?? null; },
    listRecaps(studentId) { return db.select({ sessionId: sessionRecaps.sessionId, title: sessionRecaps.title, summary: sessionRecaps.summary, discovery: sessionRecaps.discovery, createdAt: sessionRecaps.createdAt, type: sessions.type }).from(sessionRecaps).innerJoin(sessions, eq(sessionRecaps.sessionId, sessions.id)).where(eq(sessionRecaps.studentId, studentId)).orderBy(asc(sessionRecaps.createdAt)); },
    async createMorningRipple(value) { return (await db.insert(morningRippleEntries).values(value).onConflictDoNothing().returning())[0] ?? null; },
    listMorningRipples(studentId) { return db.select().from(morningRippleEntries).where(eq(morningRippleEntries.studentId, studentId)).orderBy(asc(morningRippleEntries.createdAt)); }
  });
}
