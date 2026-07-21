import { AppError } from '#api/shared/errors/appError.js';

export function createPrivacyService({ repositories }) {
  async function ownerStudent(parent, studentId) {
    if (parent.role !== 'owner') throw new AppError(403, 'OWNER_REQUIRED', 'Only the household owner can manage child privacy requests.');
    const student = await repositories.canAccessStudent({ householdId: parent.household_id, studentId });
    if (!student) throw new AppError(404, 'STUDENT_NOT_FOUND', 'That child profile is not available in this household.');
    return student;
  }
  return Object.freeze({
    async exportStudent(parent, studentId) { await ownerStudent(parent, studentId); return repositories.exportStudent({ householdId: parent.household_id, studentId }); },
    async withdrawStudent(parent, studentId) { await ownerStudent(parent, studentId); await repositories.withdrawStudent({ householdId: parent.household_id, studentId }); return { accepted: true, deletedAt: new Date().toISOString() }; },
    async deleteStudent(parent, studentId) { await ownerStudent(parent, studentId); await repositories.deleteStudent({ householdId: parent.household_id, studentId }); return { accepted: true }; }
  });
}
