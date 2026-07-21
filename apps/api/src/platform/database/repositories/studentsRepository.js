import { and, desc, eq } from 'drizzle-orm';
import { consentRecords, students } from '../schema/index.js';

export function createStudentsRepository(db) {
  return Object.freeze({
    listStudents(householdId) {
      return db.select({ id: students.id, household_id: students.householdId, name: students.name, grade: students.grade }).from(students).where(eq(students.householdId, householdId)).orderBy(desc(students.createdAt)).limit(10);
    },
    async findStudentByName({ householdId, name }) {
      return (await db.select({ id: students.id, name: students.name }).from(students).where(and(eq(students.householdId, householdId), eq(students.name, name))).limit(1))[0] ?? null;
    },
    async createStudent({ householdId, name, grade, routineMorning = null, routineEvening = null, verificationReference, termsVersion = null, termsSha256 = null, acceptedByParentId = null }) {
      return db.transaction(async (tx) => {
        const [student] = await tx.insert(students).values({ householdId, name: name.trim(), grade: grade.trim(), routineMorning, routineEvening }).returning();
        await tx.insert(consentRecords).values({ householdId, studentId: student.id, purpose: 'learning_companion', noticeVersion: termsVersion ?? 'closed-demo-v1', status: 'granted', verificationReference, collectionBasis: 'demo_terms_acknowledgement', termsVersion, termsSha256, acceptedByParentId, grantedAt: new Date() });
        return student;
      });
    },
    async findAccessibleStudent({ householdId, studentId }) {
      const rows = await db.select({ id: students.id, household_id: students.householdId, name: students.name, grade: students.grade, consent_status: consentRecords.status })
        .from(students).leftJoin(consentRecords, and(eq(consentRecords.studentId, students.id), eq(consentRecords.purpose, 'learning_companion')))
        .where(and(eq(students.id, studentId), eq(students.householdId, householdId))).limit(1);
      return rows[0] ?? null;
    }
  });
}
