import { describe, expect, it, vi } from 'vitest';
import { apiUrl, createIdempotencyKey, requestJson } from '#web/shared/api/httpClient.js';

describe('shared HTTP client', () => {
  it('uses one error and authorization path for feature API modules', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    await expect(requestJson('/api/health', {}, 'token', fetch)).resolves.toEqual({ ok: true });
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer token');
    expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it('turns an aborted request into a recoverable message', async () => {
    const fetch = vi.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    await expect(requestJson('/api/health', {}, null, fetch)).rejects.toThrow('This is taking too long. Please try again.');
  });

  it('handles network, invalid JSON, and API error responses', async () => {
    await expect(requestJson('/api/health', {}, null, vi.fn().mockRejectedValue(new Error('offline')))).rejects.toThrow('Network unavailable');
    await expect(requestJson('/api/health', {}, null, vi.fn().mockResolvedValue({ ok: true, json: async () => { throw new Error('bad json'); } }))).rejects.toThrow('unreadable');
    await expect(requestJson('/api/health', {}, null, vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: { message: 'Nope' } }) }))).rejects.toThrow('Nope');
    await expect(requestJson('/api/health', {}, null, vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error('bad json'); } }))).rejects.toThrow('502');
  });

  it('creates a client idempotency key', () => {
    expect(createIdempotencyKey()).toMatch(/^turn-|^[0-9a-f-]{36}$/);
    expect(apiUrl('/session/start')).toBe('/api/session/start');
  });
});
