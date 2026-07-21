import { describe, expect, it } from 'vitest';
import { createStudentsService } from '#api/modules/students/index.js';

describe('students module', () => {
  const parent = { household_id: 'household-1' };
  it('keeps validation and persistence behind one reusable use case', async () => {
    const calls = []; const module = createStudentsService({ config: { demoTermsVersion: 'closed-demo-v1', demoTermsSha256: 'terms-hash' }, repositories: { hasActiveTerms: async () => true, createStudent: async (value) => { calls.push(value); return { id: 1, ...value }; }, listStudents: async () => [] } });
    await expect(module.create(parent, { name: '', grade: '4', demoTermsAcknowledged: true })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    await expect(module.create(parent, { name: 'Ada', grade: '4', demoTermsAcknowledged: false })).rejects.toMatchObject({ code: 'TERMS_REQUIRED' });
    await module.create(parent, { name: 'Ada', grade: '4', demoTermsAcknowledged: true });
    expect(calls[0]).toMatchObject({ householdId: 'household-1', name: 'Ada', verificationReference: 'closed-demo-terms-acknowledgement', termsSha256: 'terms-hash' });
  });

  it('lists only students accessible to the active household', async () => {
    const listStudents = async (householdId) => [{ id: 'student', householdId }];
    const module = createStudentsService({ config: {}, repositories: { createStudent: async () => ({}), listStudents } });
    await expect(module.list({ household_id: 'household-1' })).resolves.toEqual([{ id: 'student', householdId: 'household-1' }]);
  });
});
