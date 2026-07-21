import { AppError } from '#api/shared/errors/appError.js';
export function createStudentsService({ repositories, config }) {
  return Object.freeze({
    list: (parent) => repositories.listStudents(parent.household_id),
    async create(parent, body) {
      const { name, grade, routineMorning, routineEvening, demoTermsAcknowledged } = body ?? {};
      if (!name?.trim() || !grade?.trim()) throw new AppError(400, 'VALIDATION_ERROR', 'Name and grade are required.');
      if (demoTermsAcknowledged !== true || !(await repositories.hasActiveTerms(parent.household_id))) throw new AppError(403, 'TERMS_REQUIRED', 'An invited guardian must accept the closed-demo terms before creating a child profile.');
      return repositories.createStudent({ householdId: parent.household_id, name, grade, routineMorning, routineEvening, verificationReference: 'closed-demo-terms-acknowledgement', termsVersion: config.demoTermsVersion, termsSha256: config.demoTermsSha256, acceptedByParentId: parent.parent_id ?? parent.id });
    }
  });
}
