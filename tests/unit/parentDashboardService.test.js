import { describe, expect, it, vi } from 'vitest';
import { createParentDashboardService } from '#api/modules/parent-dashboard/index.js';

const dashboard = {
  student: { id: 'student-a', name: 'Ari', grade: '3' },
  setup: { profile: true, rhythm: true, device: true, pin: true, firstMoment: true },
  topics: [{ id: 'topic-1', label: 'Clouds' }],
  safety: [],
  thisWeek: { todayCompleted: 1, completedSessions: 3, engagementNote: 'Short check-ins are building a routine.' },
  recentMoments: [{ id: 'moment-1', type: 'evening', completedAt: new Date('2026-07-21T10:00:00.000Z'), label: 'Evening discovery' }]
};

function makeService(overrides = {}) {
  return createParentDashboardService({ repositories: {
    canAccessStudent: async () => ({ id: 'student-a' }),
    getDashboard: vi.fn(async () => dashboard),
    listHouseholdDashboardSummaries: vi.fn(async () => [{ id: 'student-a', name: 'Ari', grade: '3', todayCompleted: 1, lastActivityAt: new Date('2026-07-21T10:00:00.000Z') }, { id: 'student-b', name: 'Bea', grade: '1', todayCompleted: 0, lastActivityAt: null }]),
    getChildPreferences: async () => null,
    getHouseholdPreferences: async () => null,
    ...overrides
  } });
}

describe('parent dashboard daily overview', () => {
  it('returns safe activity summaries and only household-scoped child cards', async () => {
    const service = makeService();
    const result = await service.get({ id: 'parent-a', household_id: 'household-a' }, 'student-a');

    expect(result.thisWeek).toMatchObject({ todayCompleted: 1, completedSessions: 3 });
    expect(result.recentMoments).toEqual([expect.objectContaining({ id: 'moment-1', label: 'Evening discovery' })]);
    expect(result.householdChildren).toEqual([expect.objectContaining({ id: 'student-a' }), expect.objectContaining({ id: 'student-b' })]);
    expect(JSON.stringify(result)).not.toContain('ciphertext');
  });

  it('prioritizes an unacknowledged safety check over routine guidance', async () => {
    const service = makeService({ getDashboard: async () => ({ ...dashboard, safety: [{ id: 'safety-1', acknowledgedAt: null }] }) });
    const result = await service.get({ id: 'parent-a', household_id: 'household-a' }, 'student-a');

    expect(result.home.nextAction).toMatchObject({ kind: 'safety', safetyEventId: 'safety-1' });
  });

  it('stores an encrypted summary-only advisor exchange for an authorized parent', async () => {
    const createAdvisorTurn = vi.fn(); const completeAdvisorRequest = vi.fn(); const advise = vi.fn(async () => 'Try one optional question together.');
    const service = createParentDashboardService({ repositories: {
      canAccessStudent: async () => ({ id: 'student-a' }), getDashboard: async () => ({ ...dashboard, effortMoments: [], conversationStarters: [] }), listParentRituals: async () => [], getAdvisorRequest: async () => null, countAdvisorTurns: async () => 0, createAdvisorRequest: async () => ({ id: 'request-1' }), completeAdvisorRequest, removeAdvisorRequest: vi.fn(), createAdvisorTurn
    }, agents: { advise }, encryption: { encrypt: (text) => ({ ciphertext: text, iv: 'iv', authTag: 'tag', keyVersion: 'v1' }) }, config: { parentAdvisorDailyTurnLimit: 2 } });
    await expect(service.advisorTurn({ id: 'parent-a', household_id: 'household-a' }, 'student-a', { input: 'How can I help tonight?', idempotencyKey: 'advisor-1' })).resolves.toMatchObject({ message: 'Try one optional question together.', context: 'summary_only' });
    expect(advise).toHaveBeenCalledWith(expect.objectContaining({ question: 'How can I help tonight?' }));
    expect(createAdvisorTurn).toHaveBeenCalledTimes(2); expect(completeAdvisorRequest).toHaveBeenCalledWith('request-1', expect.objectContaining({ context: 'summary_only' }));
  });
});
