import { and, count, desc, eq, gte, isNotNull, isNull, lt, ne, or } from 'drizzle-orm';
import { morningRippleEntries, safetyEvents, sessionRecaps, sessions, studentDeviceSessions, studentRitualSettings, students } from '../schema/index.js';

const startOfUtcDay = (value = new Date()) => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
const normalCompletedSessions = (studentId, from = null, to = null) => and(
  eq(sessions.studentId, studentId),
  isNotNull(sessions.endedAt),
  or(isNull(sessions.endReason), ne(sessions.endReason, 'safety')),
  ...(from ? [gte(sessions.endedAt, from)] : []),
  ...(to ? [lt(sessions.endedAt, to)] : [])
);

export function createParentDashboardRepository(db, { learningRepository }) {
  return Object.freeze({
    async getDashboard(studentId, { dayStart = startOfUtcDay(), dayEnd = new Date(dayStart.getTime() + 86400000), weekStart = new Date(dayStart.getTime() - 6 * 86400000) } = {}) {
      const [student] = await db.select({ id: students.id, name: students.name, grade: students.grade, pinSet: students.pinHash }).from(students).where(eq(students.id, studentId)).limit(1);
      if (!student) return null;
      const [allSessions, todaySessions, weekSessions, recentSessions, rawTopics, wins, safety, ritualSettings, approvedDevices] = await Promise.all([
        db.select({ sessionCount: count() }).from(sessions).where(normalCompletedSessions(studentId)),
        db.select({ sessionCount: count() }).from(sessions).where(normalCompletedSessions(studentId, dayStart, dayEnd)),
        db.select({ sessionCount: count() }).from(sessions).where(normalCompletedSessions(studentId, weekStart, dayEnd)),
        db.select({ id: sessions.id, type: sessions.type, endedAt: sessions.endedAt }).from(sessions).where(normalCompletedSessions(studentId)).orderBy(desc(sessions.endedAt)).limit(3),
        learningRepository.listTopics(studentId),
        learningRepository.listWins(studentId),
        db.select().from(safetyEvents).where(eq(safetyEvents.studentId, studentId)).orderBy(desc(safetyEvents.createdAt)).limit(5),
        db.select().from(studentRitualSettings).where(eq(studentRitualSettings.studentId, studentId)).limit(1),
        db.select({ id: studentDeviceSessions.id }).from(studentDeviceSessions).where(and(eq(studentDeviceSessions.studentId, studentId), isNull(studentDeviceSessions.revokedAt))).limit(1)
      ]);
      const sessionCount = Number(allSessions[0]?.sessionCount ?? 0);
      const todayCompleted = Number(todaySessions[0]?.sessionCount ?? 0);
      const weekCompleted = Number(weekSessions[0]?.sessionCount ?? 0);
      const topics = await Promise.all(rawTopics.map(async (topic) => {
        const signals = await learningRepository.listScoresForTopic(topic.id);
        const latest = signals[0];
        return { id: topic.id, label: topic.label, firstSeenAt: topic.firstSeenAt, lastSeenAt: latest?.assessedAt ?? topic.firstSeenAt, nextReviewAt: topic.nextReviewAt, signalCount: signals.length, gapLabel: latest?.gapLabel ?? 'still_gathering_signal', trend: signals.length < 2 ? 'still_gathering' : (latest?.understanding ?? 0) >= (signals.at(-1)?.understanding ?? 0) ? 'steady_or_growing' : 'gentle_revisit' };
      }));
      const upcomingReviews = topics.filter((topic) => topic.nextReviewAt && topic.nextReviewAt <= new Date()).map(({ label, nextReviewAt }) => ({ label, nextReviewAt }));
      const safetyAlerts = safety.map((event) => ({ id: event.id, category: event.category, createdAt: event.createdAt, acknowledgedAt: event.acknowledgedAt, message: 'A safety check needs your attention. Please check in with your child now.' }));
      const setup = { profile: true, rhythm: Boolean(ritualSettings[0]), device: Boolean(approvedDevices[0]), pin: Boolean(student.pinSet), firstMoment: sessionCount > 0 };
      const recentMoments = recentSessions.map((session) => ({ id: session.id, type: session.type, completedAt: session.endedAt, label: session.type === 'morning' ? 'Morning ripple' : 'Evening discovery' }));
      return { student: { id: student.id, name: student.name, grade: student.grade }, sessionCount, lastActivityAt: recentMoments[0]?.completedAt ?? null, recentMoments, setup, topics, upcomingReviews, effortMoments: wins.map((win) => ({ id: win.id, message: win.message, createdAt: win.createdAt })), safety: safetyAlerts, conversationStarters: topics.slice(0, 3).map((topic) => `Ask what they would like to teach you about ${topic.label}.`), thisWeek: { completedSessions: weekCompleted, todayCompleted, engagementNote: weekCompleted ? 'Short check-ins are building a routine.' : 'No completed check-ins yet. Starting small is welcome.' }, transparency: 'Parent view includes encrypted learning history, topic-level signals, routines, and safety-event metadata. Triggering safety text is never stored.' };
    },
    async listHouseholdSummaries(householdId, { dayStart = startOfUtcDay(), dayEnd = new Date(dayStart.getTime() + 86400000) } = {}) {
      const profiles = await db.select({ id: students.id, name: students.name, grade: students.grade }).from(students).where(eq(students.householdId, householdId)).orderBy(desc(students.createdAt)).limit(10);
      return Promise.all(profiles.map(async (profile) => {
        const [todayRows, latestRows] = await Promise.all([
          db.select({ sessionCount: count() }).from(sessions).where(normalCompletedSessions(profile.id, dayStart, dayEnd)),
          db.select({ endedAt: sessions.endedAt }).from(sessions).where(normalCompletedSessions(profile.id)).orderBy(desc(sessions.endedAt)).limit(1)
        ]);
        return { ...profile, todayCompleted: Number(todayRows[0]?.sessionCount ?? 0), lastActivityAt: latestRows[0]?.endedAt ?? null };
      }));
    },
    async listParentRituals(studentId) {
      const [mornings, evenings] = await Promise.all([
        db.select({ id: morningRippleEntries.id, completedAt: morningRippleEntries.createdAt, path: morningRippleEntries.path, intention: morningRippleEntries.intention, activity: morningRippleEntries.activityResult, collectible: morningRippleEntries.collectible }).from(morningRippleEntries).where(eq(morningRippleEntries.studentId, studentId)).orderBy(desc(morningRippleEntries.createdAt)).limit(20),
        db.select({ id: sessionRecaps.sessionId, completedAt: sessionRecaps.createdAt, title: sessionRecaps.title, summary: sessionRecaps.summary, collectible: sessionRecaps.discovery }).from(sessionRecaps).innerJoin(sessions, eq(sessionRecaps.sessionId, sessions.id)).where(and(eq(sessionRecaps.studentId, studentId), eq(sessions.type, 'evening'))).orderBy(desc(sessionRecaps.createdAt)).limit(20)
      ]);
      return [...mornings.map((entry) => ({ ...entry, type: 'morning', label: 'Morning Ripple' })), ...evenings.map((entry) => ({ ...entry, type: 'evening', label: 'Evening Discovery' }))].sort((left, right) => new Date(right.completedAt) - new Date(left.completedAt)).slice(0, 30);
    }
  });
}
