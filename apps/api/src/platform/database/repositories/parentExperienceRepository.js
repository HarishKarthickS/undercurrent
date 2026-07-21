import { and, count, eq, gte } from 'drizzle-orm';
import { householdPreferences, parentAdvisorRequests, parentAdvisorTurns, parentChildPreferences, productAnalyticsEvents } from '../schema/index.js';

export function createParentExperienceRepository(db) {
  return Object.freeze({
    async getHouseholdPreferences(householdId) { return (await db.select().from(householdPreferences).where(eq(householdPreferences.householdId, householdId)).limit(1))[0] ?? null; },
    async saveHouseholdPreferences(householdId, values) { return (await db.insert(householdPreferences).values({ householdId, ...values, updatedAt: new Date() }).onConflictDoUpdate({ target: householdPreferences.householdId, set: { ...values, updatedAt: new Date() } }).returning())[0]; },
    async getChildPreferences(parentId, studentId) { return (await db.select().from(parentChildPreferences).where(and(eq(parentChildPreferences.parentId, parentId), eq(parentChildPreferences.studentId, studentId))).limit(1))[0] ?? null; },
    async saveChildPreferences(parentId, studentId, values) { return (await db.insert(parentChildPreferences).values({ parentId, studentId, ...values, updatedAt: new Date() }).onConflictDoUpdate({ target: [parentChildPreferences.parentId, parentChildPreferences.studentId], set: { ...values, updatedAt: new Date() } }).returning())[0]; },
    recordProductAnalyticsEvent(householdId, eventName) { return db.insert(productAnalyticsEvents).values({ householdId, eventName }); },
    async createAdvisorTurn(value) { return (await db.insert(parentAdvisorTurns).values(value).returning())[0]; },
    listAdvisorTurns(parentId, studentId) { return db.select().from(parentAdvisorTurns).where(and(eq(parentAdvisorTurns.parentId, parentId), eq(parentAdvisorTurns.studentId, studentId))).orderBy(parentAdvisorTurns.createdAt); },
    async clearAdvisorTurns(parentId, studentId) { await db.delete(parentAdvisorTurns).where(and(eq(parentAdvisorTurns.parentId, parentId), eq(parentAdvisorTurns.studentId, studentId))); },
    async getAdvisorRequest(parentId, studentId, idempotencyKey) { return (await db.select().from(parentAdvisorRequests).where(and(eq(parentAdvisorRequests.parentId, parentId), eq(parentAdvisorRequests.studentId, studentId), eq(parentAdvisorRequests.idempotencyKey, idempotencyKey))).limit(1))[0] ?? null; },
    async createAdvisorRequest(value) { return (await db.insert(parentAdvisorRequests).values(value).onConflictDoNothing().returning())[0] ?? null; },
    async completeAdvisorRequest(id, responseBody) { return (await db.update(parentAdvisorRequests).set({ responseBody, completedAt: new Date() }).where(eq(parentAdvisorRequests.id, id)).returning())[0] ?? null; },
    async removeAdvisorRequest(id) { await db.delete(parentAdvisorRequests).where(eq(parentAdvisorRequests.id, id)); }
    ,async countAdvisorTurns(parentId, studentId, from) { const [row] = await db.select({ total: count() }).from(parentAdvisorTurns).where(and(eq(parentAdvisorTurns.parentId, parentId), eq(parentAdvisorTurns.studentId, studentId), eq(parentAdvisorTurns.role, 'parent'), gte(parentAdvisorTurns.createdAt, from))); return Number(row?.total ?? 0); }
  });
}
