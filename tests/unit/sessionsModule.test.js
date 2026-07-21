import { describe, expect, it, vi } from 'vitest';
import { ageBandForGrade, buildCuriosityTrail, createSessionsService, effectiveAgeBand } from '#api/modules/sessions/sessionsService.js';

function baseRepositories(overrides = {}) {
  return {
    canAccessStudent: async () => ({ id: 'student', consent_status: 'granted' }),
    createSession: async () => ({ id: 'session' }),
    getSession: async () => ({ id: 'session', student_id: 'student', type: 'evening', started_at: new Date(), turn_count: 0, scaffold_stage: 'ask' }),
    endSession: async () => ({}),
    getTurnRequest: async () => null,
    createTurnRequest: async (request) => ({ id: 'request', ...request }),
    completeTurnRequest: async () => ({}),
    removeTurnRequest: async () => undefined,
    createSafetyEvent: async () => ({}),
    addSessionTurn: async () => ({}),
    upsertTopic: async () => ({ id: 'topic' }),
    addScore: async () => ({}),
    addWin: async () => ({}),
    updateSessionProgress: async () => ({}),
    listCompletedSessions: async () => [],
    getRitualSettings: async () => null,
    saveRitualSettings: async (_studentId, settings) => settings,
    createRecap: async () => ({}),
    listRecaps: async () => [],
    listSessionTurns: async () => [],
    ...overrides
  };
}

describe('sessions module', () => {
  it('derives a safe age band from grade and lets a parent override it without collecting a birth date', () => {
    expect(ageBandForGrade('K')).toBe('early');
    expect(ageBandForGrade('2')).toBe('early');
    expect(ageBandForGrade('4')).toBe('explorer');
    expect(ageBandForGrade('7')).toBe('independent');
    expect(effectiveAgeBand('1', { experienceBandOverride: 'independent' })).toBe('independent');
  });

  it('authorizes the child profile before starting a session', async () => {
    const module = createSessionsService({ repositories: baseRepositories() });
    await expect(module.start({ household_id: 'h' }, { studentId: 'student' })).resolves.toMatchObject({ sessionId: 'session', sessionType: 'evening', quest: { step: 'spark', inputModes: ['tap', 'typed', 'voice'] }, settings: { preferredStyle: 'adaptive' } });
  });

  it('returns curated starters and a due idea for the student learning home', async () => {
    const module = createSessionsService({ repositories: baseRepositories({ listTopics: async () => [{ label: 'fractions', nextReviewAt: new Date('2020-01-01') }], listRecaps: async () => [{ title: 'A past idea' }], listMorningRipples: async () => [] }), now: () => new Date('2026-07-19T18:00:00.000Z') });
    await expect(module.home({ household_id: 'h' }, 'student')).resolves.toMatchObject({ learningHome: { starters: expect.any(Array), review: { questId: 'review:fractions', title: 'Remember & remix' }, currentKeepsake: { title: 'A past idea' } } });
  });

  it('ends a safety turn before calling any AI collaborator', async () => {
    const calls = [];
    const module = createSessionsService({ repositories: baseRepositories({
      createSafetyEvent: async (event) => calls.push(['safety', event]),
      endSession: async () => calls.push(['end'])
    }), agents: { assess: async () => { throw new Error('AI must not run'); } }, encryption: { encrypt: () => ({}) }, notifySafety: async () => calls.push(['notify']) });
    await expect(module.turn({ household_id: 'h' }, { sessionId: 'session', input: 'I want to hurt myself', idempotencyKey: 'safety-turn' })).resolves.toMatchObject({ terminal: true, parentNotification: true });
    expect(calls.map(([name]) => name)).toEqual(['safety', 'end', 'notify']);
  });

  it('uses the default no-op notifier when no safety notifier is supplied', async () => {
    const module = createSessionsService({ repositories: baseRepositories(), agents: { assess: vi.fn() }, encryption: { encrypt: () => ({}) } });
    await expect(module.turn({ household_id: 'h' }, { sessionId: 'session', input: 'I want to hurt myself', idempotencyKey: 'default-notify' })).resolves.toMatchObject({ terminal: true });
  });

  it('screens a morning turn before its non-AI response branch', async () => {
    const calls = [];
    const module = createSessionsService({ repositories: baseRepositories({ getSession: async () => ({ id: 'session', student_id: 'student', type: 'morning', started_at: new Date(), turn_count: 0 }), createSafetyEvent: async () => calls.push('safety'), endSession: async () => calls.push('end') }), notifySafety: async () => calls.push('notify') });
    await expect(module.turn({ household_id: 'h' }, { sessionId: 'session', input: 'I took pills', idempotencyKey: 'morning-safety' })).resolves.toMatchObject({ terminal: true, parentNotification: true });
    expect(calls).toEqual(['safety', 'end', 'notify']);
  });

  it('returns a completed response for a matching retry without calling AI', async () => {
    const agents = { assess: vi.fn(), compose: vi.fn() };
    const module = createSessionsService({ repositories: baseRepositories({
      getTurnRequest: async () => ({ request_hash: '4b7d2bf5359baaff10e06bf084da963ddb856cedf990fd452041ac545f64e73b', response_body: { message: 'Saved reply.', terminal: false } })
    }), agents, encryption: { encrypt: () => ({}) } });
    await expect(module.turn({ household_id: 'h' }, { sessionId: 'session', input: 'fractions', idempotencyKey: 'retry-key' })).resolves.toEqual({ message: 'Saved reply.', terminal: false });
    expect(agents.assess).not.toHaveBeenCalled();
  });

  it('clears an idempotency claim when AI processing fails', async () => {
    const removeTurnRequest = vi.fn();
    const module = createSessionsService({ repositories: baseRepositories({ removeTurnRequest }), agents: { assess: async () => { throw new Error('timeout'); } }, encryption: { encrypt: () => ({}) } });
    await expect(module.turn({ household_id: 'h' }, { sessionId: 'session', input: 'fractions', idempotencyKey: 'retry-key' })).rejects.toMatchObject({ code: 'AI_UNAVAILABLE', statusCode: 503 });
    expect(removeTurnRequest).toHaveBeenCalledWith('request');
  });

  it('lets an authorized parent read live ordinary turns without transcript consent', async () => {
    const module = createSessionsService({ repositories: baseRepositories({ listParentConversations: async () => [{ id: 'live', type: 'evening', quest_id: 'talk-to-pip', started_at: new Date('2026-07-21T12:00:00.000Z'), ended_at: null, turn_count: 1 }], getSession: async () => ({ id: 'live', student_id: 'student', type: 'evening', quest_id: 'talk-to-pip', started_at: new Date('2026-07-21T12:00:00.000Z'), ended_at: null }), listSessionTurns: async () => [{ id: 'turn-1', role: 'child', created_at: new Date('2026-07-21T12:01:00.000Z') }] }), encryption: { decrypt: () => 'I found a pattern.' } });
    await expect(module.conversations({ household_id: 'h', id: 'parent' }, 'student')).resolves.toMatchObject({ conversations: [{ id: 'live', live: true, mode: 'chat' }] });
    await expect(module.conversation({ household_id: 'h', id: 'parent' }, 'student', 'live')).resolves.toMatchObject({ conversation: { id: 'live', live: true }, turns: [{ role: 'child', text: 'I found a pattern.' }] });
  });

  it('never returns safety-ended conversations to a parent', async () => {
    const module = createSessionsService({ repositories: baseRepositories({ getSession: async () => ({ id: 'safe', student_id: 'student', end_reason: 'safety' }) }), encryption: { decrypt: () => 'hidden' } });
    await expect(module.conversation({ household_id: 'h' }, 'student', 'safe')).rejects.toMatchObject({ code: 'CONVERSATION_NOT_FOUND', statusCode: 404 });
  });

  it('starts both private assessments together before composing Pip\'s reply', async () => {
    let releaseFirstAssessment;
    const assessment = { topic: 'fractions', understanding: 2, confidence: 2, disengaged: false };
    const agents = { assess: vi.fn().mockImplementationOnce(() => new Promise((resolve) => { releaseFirstAssessment = () => resolve(assessment); })).mockResolvedValueOnce(assessment), compose: vi.fn().mockResolvedValue('Tell me one more fraction story.') };
    const module = createSessionsService({ repositories: baseRepositories(), agents, encryption: { encrypt: () => ({}) } });
    const turn = module.turn({ household_id: 'h' }, { sessionId: 'session', input: 'I split a pizza into halves.', idempotencyKey: 'parallel-assessments' });
    await vi.waitFor(() => expect(agents.assess).toHaveBeenCalledTimes(2));
    releaseFirstAssessment();
    await expect(turn).resolves.toMatchObject({ message: 'Tell me one more fraction story.' });
  });

  it('enforces a household AI-turn budget without blocking safety disclosures', async () => {
    const module = createSessionsService({ repositories: baseRepositories({ countHouseholdTurnRequests: async () => 1 }), config: { aiDailyTurnLimit: 1 }, agents: { assess: vi.fn(), compose: vi.fn() }, encryption: { encrypt: () => ({}) } });
    await expect(module.turn({ household_id: 'h' }, { sessionId: 'session', input: 'fractions', idempotencyKey: 'budget-turn' })).rejects.toMatchObject({ code: 'HOUSEHOLD_AI_LIMIT', statusCode: 429 });
    await expect(module.turn({ household_id: 'h' }, { sessionId: 'session', input: 'I took pills', idempotencyKey: 'budget-safety' })).resolves.toMatchObject({ terminal: true });
  });

  it('returns a seven-day curiosity trail with one lit dot per completed day', async () => {
    const listCompletedSessions = vi.fn(async () => [
      { ended_at: new Date('2026-07-18T12:00:00.000Z') },
      { ended_at: new Date('2026-07-18T18:00:00.000Z') },
      { ended_at: new Date('2026-07-19T08:00:00.000Z') }
    ]);
    const module = createSessionsService({ repositories: baseRepositories({ listCompletedSessions }), now: () => new Date('2026-07-19T10:00:00.000Z') });
    await expect(module.getCuriosityTrail({ household_id: 'h' }, 'student')).resolves.toEqual({ days: [
      { date: '2026-07-13', completed: false }, { date: '2026-07-14', completed: false }, { date: '2026-07-15', completed: false }, { date: '2026-07-16', completed: false }, { date: '2026-07-17', completed: false }, { date: '2026-07-18', completed: true }, { date: '2026-07-19', completed: true }
    ] });
    expect(listCompletedSessions).toHaveBeenCalledWith('student', { from: new Date('2026-07-13T00:00:00.000Z'), to: new Date('2026-07-20T00:00:00.000Z') });
  });

  it('uses the default clock for a curiosity trail when one is not injected', async () => {
    const module = createSessionsService({ repositories: baseRepositories() });
    await expect(module.getCuriosityTrail({ household_id: 'h' }, 'student')).resolves.toMatchObject({ days: expect.any(Array) });
  });

  it('does not light a day for a safety-ended session because the repository only supplies completed sessions', () => {
    expect(buildCuriosityTrail([], new Date('2026-07-19T10:00:00.000Z')).at(-1)).toEqual({ date: '2026-07-19', completed: false });
  });

  it('ends an authorized session and rejects an inaccessible child profile', async () => {
    const endSession = vi.fn();
    const module = createSessionsService({ repositories: baseRepositories({ endSession }) });
    await expect(module.end({ household_id: 'h' }, { sessionId: 'session', reason: 'child_exit' })).resolves.toEqual({ ok: true });
    expect(endSession).toHaveBeenCalledWith('session', 'child_exit');
    const denied = createSessionsService({ repositories: baseRepositories({ canAccessStudent: async () => null }) });
    await expect(denied.start({ household_id: 'h' }, { studentId: 'student' })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
  });
});
