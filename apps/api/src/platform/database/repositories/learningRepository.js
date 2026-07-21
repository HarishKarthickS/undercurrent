import { desc, eq } from 'drizzle-orm';
import { scores, topics, wins } from '../schema/index.js';

export function createLearningRepository(db) {
  return Object.freeze({
    listTopics(studentId) { return db.select().from(topics).where(eq(topics.studentId, studentId)).orderBy(topics.nextReviewAt, topics.label); },
    listWins(studentId) { return db.select().from(wins).where(eq(wins.studentId, studentId)).orderBy(desc(wins.createdAt)).limit(5); }
    ,async upsertTopic({ studentId, label, review }) { return (await db.insert(topics).values({ studentId, label, ...review }).onConflictDoUpdate({ target: [topics.studentId, topics.label], set: review }).returning())[0]; },
    async addScore(value) { return (await db.insert(scores).values(value).returning())[0]; },
    async addWin(value) { return (await db.insert(wins).values(value).returning())[0]; },
    listScoresForTopic(topicId) { return db.select().from(scores).where(eq(scores.topicId, topicId)).orderBy(desc(scores.assessedAt)); }
  });
}
