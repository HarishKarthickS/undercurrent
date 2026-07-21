import { apiUrl, requestJson } from '#web/shared/api/index.js';

export const listProfiles = (token) => requestJson(apiUrl('/students'), {}, token);
export const createProfile = (payload, token) => requestJson(apiUrl('/students'), { method: 'POST', body: JSON.stringify(payload) }, token);
