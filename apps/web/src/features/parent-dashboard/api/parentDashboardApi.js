import { apiUrl, requestJson } from '#web/shared/api/index.js';

export const loadParentDashboard = (studentId, token) => requestJson(apiUrl(`/parent/${studentId}/dashboard`), {}, token);
export const saveParentExperience = (studentId, value, token) => requestJson(apiUrl(`/parent/${studentId}/experience`), { method: 'PUT', body: JSON.stringify(value) }, token);
export const saveHouseholdExperience = (value, token) => requestJson(apiUrl('/parent/experience/household'), { method: 'PUT', body: JSON.stringify(value) }, token);
export const acknowledgeSafety = (studentId, eventId, token) => requestJson(apiUrl(`/parent/${studentId}/safety/${eventId}/acknowledge`), { method: 'POST' }, token);
export const trackParentExperience = (eventName) => requestJson(apiUrl('/parent/product-events'), { method: 'POST', body: JSON.stringify({ eventName }) });
export const getParentTopic = (studentId, topicId) => requestJson(apiUrl(`/parent/${studentId}/topics/${topicId}`));
export const getAdvisorHistory = (studentId) => requestJson(apiUrl(`/parent/${studentId}/advisor/history`));
export const clearAdvisorHistory = (studentId) => requestJson(apiUrl(`/parent/${studentId}/advisor/history`), { method: 'DELETE' });
export const sendAdvisorTurn = (studentId, payload) => requestJson(apiUrl(`/parent/${studentId}/advisor/turn`), { method: 'POST', body: JSON.stringify(payload) });
