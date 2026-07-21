import { apiUrl, requestJson } from '#web/shared/api/index.js';

export const startSession = (studentId, type, mode = 'quest', questId = null, legacyToken = null) => { const legacy = legacyToken ?? (!['quest', 'chat', 'activity'].includes(mode) ? mode : null); return requestJson(apiUrl(legacy ? '/session/start' : '/student/session/start'), { method: 'POST', body: JSON.stringify({ studentId, type, mode: legacy ? 'quest' : mode, ...(questId ? { questId } : {}) }) }, legacy); };
export const getCuriosityTrail = (studentId, legacyToken = null) => requestJson(apiUrl(legacyToken ? `/session/${studentId}/curiosity-trail` : `/student/session/${studentId}/curiosity-trail`), {}, legacyToken);
export const sendTurn = (payload, legacyToken = null) => requestJson(apiUrl(legacyToken ? '/session/turn' : '/student/session/turn'), { method: 'POST', body: JSON.stringify(payload) }, legacyToken);
export const endSession = (sessionId, reason, legacyToken = null) => requestJson(apiUrl(legacyToken ? '/session/end' : '/student/session/end'), { method: 'POST', body: JSON.stringify({ sessionId, reason }) }, legacyToken);
export const getRitualHome = (studentId) => requestJson(apiUrl(`/student/${studentId}/ritual-home`));
export const getStudentReflections = (studentId, sessionId = '') => requestJson(apiUrl(`/student/${studentId}/reflections${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`));
export const getParentRitualSettings = (studentId) => requestJson(apiUrl(`/parent/students/${studentId}/ritual-settings`));
export const saveParentRitualSettings = (studentId, payload) => requestJson(apiUrl(`/parent/students/${studentId}/ritual-settings`), { method: 'PUT', body: JSON.stringify(payload) });
export const getParentReflections = (studentId, sessionId = '') => requestJson(apiUrl(`/parent/students/${studentId}/reflections${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`));
export const getParentConversations = (studentId) => requestJson(apiUrl(`/parent/students/${studentId}/conversations`));
export const getParentConversation = (studentId, sessionId) => requestJson(apiUrl(`/parent/students/${studentId}/conversations/${sessionId}`));
export const completeMorningRipple = (payload) => requestJson(apiUrl('/student/morning-ripple/complete'), { method: 'POST', body: JSON.stringify(payload) });
export const getMorningRipples = (studentId) => requestJson(apiUrl(`/student/${studentId}/morning-ripples`));
export const getParentMorningRipples = (studentId) => requestJson(apiUrl(`/parent/students/${studentId}/morning-ripples`));
