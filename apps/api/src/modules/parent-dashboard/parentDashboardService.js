import { createHash } from 'node:crypto';
import { AppError } from '#api/shared/errors/appError.js';

const cards = ['next', 'progress', 'conversation', 'digest', 'topics', 'effort'];
const householdDefaults = { locale: 'en', dailyDigestEnabled: true, weeklyDigestEnabled: true, productAnalyticsConsent: false };
const childDefaults = { dashboardLayout: cards, guidanceMode: 'gentle', goalType: 'sessions', goalTarget: 3, transcriptConsent: false, advisorConsent: false };
const analyticsEvents = new Set(['profile_created', 'rhythm_selected', 'device_handoff_selected', 'pin_completed', 'first_ritual_started', 'first_ritual_completed']);
const utcDayRange = (now = new Date()) => {
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { dayStart, dayEnd: new Date(dayStart.getTime() + 86400000), weekStart: new Date(dayStart.getTime() - 6 * 86400000) };
};

const advisorSummary = (dashboard, rituals) => JSON.stringify({ student: dashboard.student.name, thisWeek: dashboard.thisWeek, topics: dashboard.topics.map(({ label, signalCount, trend, nextReviewAt }) => ({ label, signalCount, trend, nextReviewAt })), effort: dashboard.effortMoments.map(({ message }) => message), rituals: rituals.slice(0, 6).map(({ type, label, path, intention, title, summary, completedAt }) => ({ type, label, path, intention, title, summary, completedAt })), conversationStarters: dashboard.conversationStarters });

export function createParentDashboardService({ repositories, agents = null, encryption = null, config = { parentAdvisorDailyTurnLimit: 12 } }) {
  async function authorize(parent, studentId) { const student = await repositories.canAccessStudent({ householdId: parent.household_id, studentId }); if (!student) throw new AppError(403, 'ACCESS_DENIED', 'That child profile is not available to this parent session.'); return student; }
  const parentId = (parent) => parent.id ?? parent.parent_id;
  const childFor = async (parent, studentId) => ({ ...childDefaults, ...(await repositories.getChildPreferences(parentId(parent), studentId) ?? {}) });
  const householdFor = async (parent) => ({ ...householdDefaults, ...(await repositories.getHouseholdPreferences(parent.household_id) ?? {}) });
  return Object.freeze({
    async get(parent, studentId) {
      await authorize(parent, studentId);
      const range = utcDayRange();
const [dashboard, child, household, householdChildren, rituals] = await Promise.all([repositories.getDashboard(studentId, range), childFor(parent, studentId), householdFor(parent), repositories.listHouseholdDashboardSummaries(parent.household_id, range), repositories.listParentRituals ? repositories.listParentRituals(studentId) : []]);
      const current = child.goalType === 'topics' ? dashboard.topics.length : dashboard.thisWeek.completedSessions;
      const pendingSafety = dashboard.safety.find((item) => !item.acknowledgedAt);
      const learningDetails = dashboard.topics.map((topic) => ({ ...topic, reviewReady: Boolean(topic.nextReviewAt && new Date(topic.nextReviewAt) <= new Date()), familyPrompt: `Ask what they would like to show you about ${topic.label}.` }));
      const reviewOpportunities = learningDetails.filter((topic) => topic.reviewReady).map(({ id, label, familyPrompt }) => ({ id, label, familyPrompt }));
      return { ...dashboard, rituals, learningDetails, reviewOpportunities, householdChildren, controls: { child, household }, dailyBrief: { rituals: rituals.filter((ritual) => new Date(ritual.completedAt) >= range.dayStart), upcomingReview: reviewOpportunities[0] ?? null, routineStatus: current ? 'A calm rhythm is taking shape.' : 'There is nothing to catch up on.' }, home: { nextAction: pendingSafety ? { kind: 'safety', safetyEventId: pendingSafety.id, title: 'A calm check-in needs your attention', copy: 'Please connect with your child in person.' } : { kind: 'routine', title: current ? 'Your family rhythm is taking shape.' : 'A small moment is enough to begin.', copy: dashboard.thisWeek.engagementNote }, progress: child.guidanceMode === 'observe' ? null : { type: child.goalType, target: child.goalTarget, current, label: child.goalType === 'topics' ? 'topics explored this week' : 'moments shared this week' }, digest: { daily: `${dashboard.thisWeek.todayCompleted} completed moment${dashboard.thisWeek.todayCompleted === 1 ? '' : 's'} today.`, weekly: dashboard.thisWeek.engagementNote } } };
    },
    async updateChild(parent, studentId, value) {
      await authorize(parent, studentId); const next = { ...(await childFor(parent, studentId)), ...value };
      if (!['observe', 'gentle', 'goals'].includes(next.guidanceMode) || !['sessions', 'topics'].includes(next.goalType) || !Number.isInteger(next.goalTarget) || next.goalTarget < 1 || next.goalTarget > 14) throw new AppError(400, 'VALIDATION_ERROR', 'Choose a valid parent plan.');
      if (!Array.isArray(next.dashboardLayout) || next.dashboardLayout.some((card) => !cards.includes(card))) throw new AppError(400, 'VALIDATION_ERROR', 'Choose valid dashboard cards.');
      return { ...childDefaults, ...(await repositories.saveChildPreferences(parentId(parent), studentId, next)) };
    },
    async updateHousehold(parent, value) {
      const next = { ...(await householdFor(parent)), ...value };
      if (next.locale !== 'en' || typeof next.dailyDigestEnabled !== 'boolean' || typeof next.weeklyDigestEnabled !== 'boolean' || typeof next.productAnalyticsConsent !== 'boolean') throw new AppError(400, 'VALIDATION_ERROR', 'Choose valid household preferences.');
      return { ...householdDefaults, ...(await repositories.saveHouseholdPreferences(parent.household_id, next)) };
    },
    async recordProductEvent(parent, { eventName } = {}) {
      if (!analyticsEvents.has(eventName)) throw new AppError(400, 'VALIDATION_ERROR', 'Choose a valid product-improvement event.');
      const preferences = await householdFor(parent);
      if (!preferences.productAnalyticsConsent) return { accepted: false };
      await repositories.recordProductAnalyticsEvent(parent.household_id, eventName);
      return { accepted: true };
    },
    async acknowledgeSafety(parent, studentId, eventId) {
      await authorize(parent, studentId);
      const event = await repositories.acknowledgeSafetyEvent(studentId, eventId);
      if (!event) throw new AppError(404, 'SAFETY_EVENT_NOT_FOUND', 'That safety item is no longer available.');
      return { acknowledgedAt: event.acknowledgedAt };
    },
    async topic(parent, studentId, topicId) {
      await authorize(parent, studentId);
      const dashboard = await repositories.getDashboard(studentId);
      const topic = dashboard?.topics.find((entry) => entry.id === topicId);
      if (!topic) throw new AppError(404, 'TOPIC_NOT_FOUND', 'That learning topic is not available.');
      return { ...topic, reviewReady: Boolean(topic.nextReviewAt && new Date(topic.nextReviewAt) <= new Date()), familyPrompts: [`Ask what they would like to show you about ${topic.label}.`, `What is one example of ${topic.label} you could notice together?`] };
    },
    async advisorHistory(parent, studentId) {
      await authorize(parent, studentId);
      if (!encryption) return { turns: [] };
      const turns = await repositories.listAdvisorTurns(parentId(parent), studentId);
      return { turns: turns.map((turn) => ({ id: turn.id, role: turn.role, text: encryption.decrypt(turn), createdAt: turn.createdAt })) };
    },
    async clearAdvisorHistory(parent, studentId) {
      await authorize(parent, studentId);
      await repositories.clearAdvisorTurns(parentId(parent), studentId);
      return { ok: true };
    },
    async advisorTurn(parent, studentId, { input, idempotencyKey } = {}) {
      await authorize(parent, studentId);
      if (!input?.trim() || input.length > 1200 || !idempotencyKey?.trim()) throw new AppError(400, 'VALIDATION_ERROR', 'Ask one short question and include a retry key.');
      if (!agents || !encryption) throw new AppError(503, 'AI_UNAVAILABLE', 'The parent helper is temporarily unavailable. Please try again soon.');
      const id = parentId(parent); const hash = createHash('sha256').update(input).digest('hex');
      const existing = await repositories.getAdvisorRequest(id, studentId, idempotencyKey);
      if (existing) { if (existing.requestHash !== hash) throw new AppError(409, 'IDEMPOTENCY_MISMATCH', 'This retry key belongs to a different question.'); if (existing.responseBody) return existing.responseBody; throw new AppError(409, 'TURN_IN_PROGRESS', 'This question is still being answered.'); }
      const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
      if ((await repositories.countAdvisorTurns(id, studentId, dayStart)) >= config.parentAdvisorDailyTurnLimit) throw new AppError(429, 'ADVISOR_DAILY_LIMIT', 'The parent helper has reached its gentle daily limit. Please come back tomorrow.');
      const request = await repositories.createAdvisorRequest({ parentId: id, studentId, idempotencyKey, requestHash: hash });
      if (!request) throw new AppError(409, 'TURN_IN_PROGRESS', 'This question is still being answered.');
      try {
        const [dashboard, rituals] = await Promise.all([repositories.getDashboard(studentId), repositories.listParentRituals(studentId)]);
        const message = await agents.advise({ question: input.trim(), summary: advisorSummary(dashboard, rituals) });
        await repositories.createAdvisorTurn({ parentId: id, studentId, role: 'parent', ...encryption.encrypt(input.trim()) });
        await repositories.createAdvisorTurn({ parentId: id, studentId, role: 'advisor', ...encryption.encrypt(message) });
        const response = { message, context: 'summary_only' };
        await repositories.completeAdvisorRequest(request.id, response);
        return response;
      } catch (error) { await repositories.removeAdvisorRequest(request.id); if (error instanceof AppError) throw error; throw new AppError(503, 'AI_UNAVAILABLE', 'The parent helper is temporarily unavailable. Please try again soon.'); }
    }
  });
}
