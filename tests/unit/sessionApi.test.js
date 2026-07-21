import { describe, expect, it, vi } from 'vitest';
import { endSession, getCuriosityTrail, sendTurn, startSession } from '#web/features/child-session/api/sessionApi.js';

describe('child session API', () => {
  it('uses the expected authenticated session endpoints', async () => {
    const fetch = vi.fn().mockImplementation(async (url) => url === '/api/auth/csrf' ? { ok: true, json: async () => ({ token: 'csrf-token' }) } : { ok: true, json: async () => ({ ok: true }) });
    const originalFetch = globalThis.fetch; globalThis.fetch = fetch;
    await startSession('student', 'evening', 'token'); await getCuriosityTrail('student', 'token'); await sendTurn({ sessionId: 's' }, 'token'); await endSession('s', 'child_exit', 'token');
    expect(fetch.mock.calls.map(([url]) => url)).toEqual(['/api/auth/csrf', '/api/session/start', '/api/session/student/curiosity-trail', '/api/session/turn', '/api/session/end']);
    globalThis.fetch = originalFetch;
  });
});
