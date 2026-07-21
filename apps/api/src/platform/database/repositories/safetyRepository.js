import { and, desc, eq } from 'drizzle-orm';
import { safetyEvents } from '../schema/index.js';

export function createSafetyRepository(db) {
  return Object.freeze({
    async createSafetyEvent(value) { return (await db.insert(safetyEvents).values(value).returning())[0]; },
    listSafetyEvents(studentId) { return db.select().from(safetyEvents).where(eq(safetyEvents.studentId, studentId)).orderBy(desc(safetyEvents.createdAt)); },
    async acknowledgeSafetyEvent(studentId, eventId) { return (await db.update(safetyEvents).set({ acknowledgedAt: new Date() }).where(and(eq(safetyEvents.studentId, studentId), eq(safetyEvents.id, eventId))).returning())[0] ?? null; }
  });
}
