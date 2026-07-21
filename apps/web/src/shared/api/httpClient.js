const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';
export const apiUrl = (path) => `${baseUrl}${path}`;
let csrfToken = null;

async function csrf(fetchImpl) {
  if (csrfToken) return csrfToken;
  const response = await fetchImpl(apiUrl('/auth/csrf'), { headers: { Accept: 'application/json' }, credentials: 'include' });
  if (!response.ok) throw new Error('Security setup failed. Refresh the page and try again.');
  const body = await response.json();
  if (!body?.token) throw new Error('Security setup failed. Refresh the page and try again.');
  csrfToken = body.token;
  return csrfToken;
}

export async function requestJson(url, options = {}, _legacyToken = null, fetchImpl = globalThis.fetch, timeoutMs = 30_000) {
  const unsafe = ['POST', 'PUT', 'PATCH', 'DELETE'].includes((options.method ?? 'GET').toUpperCase());
  const headers = { Accept: 'application/json', ...(options.body == null ? {} : { 'Content-Type': 'application/json' }), ...(unsafe ? { 'X-CSRF-Token': await csrf(fetchImpl) } : {}), ...(options.headers ?? {}) };
  if (typeof _legacyToken === 'string' && _legacyToken) headers.Authorization = `Bearer ${_legacyToken}`;

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetchImpl(url, { ...options, headers, credentials: 'include', signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('This is taking too long. Please try again.');
    throw new Error('Network unavailable. Please try again.');
  } finally {
    globalThis.clearTimeout(timeout);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    if (payload !== null) throw new Error(payload?.error?.message ?? 'Something went wrong.');
    throw new Error(`Request failed with status ${response.status ?? 'unknown'}.`);
  }
  if (payload === null) {
    throw new Error('The service returned an unreadable response.');
  }
  return payload;
}

export function createIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `turn-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
