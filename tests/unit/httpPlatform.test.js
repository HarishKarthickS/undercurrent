import { describe, expect, it, vi } from 'vitest';
import { AppError } from '#api/shared/errors/appError.js';
import { createRequestId, registerRequestContext } from '#api/platform/http/requestContext.js';
import { registerErrorHandling } from '#api/platform/http/errorHandler.js';

describe('HTTP platform helpers', () => {
  it('uses a valid supplied request id and registers lifecycle hooks', async () => {
    expect(createRequestId({ headers: { 'x-request-id': 'valid-id_123' } })).toBe('valid-id_123');
    expect(createRequestId({ headers: { 'x-request-id': 'bad' } })).not.toBe('bad');
    const hooks = {}; const app = { addHook: vi.fn((name, handler) => { hooks[name] = handler; }) };
    registerRequestContext(app);
    const request = { headers: {}, log: { info: vi.fn() } }; const reply = { header: vi.fn(), statusCode: 200 };
    await hooks.onRequest(request, reply); await hooks.onResponse(request, reply);
    expect(reply.header).toHaveBeenCalledWith('X-Request-Id', request.requestId); expect(request.log.info).toHaveBeenCalled();
  });

  it('maps application and validation errors to safe responses', () => {
    const callbacks = {}; const app = { setErrorHandler: vi.fn((fn) => { callbacks.error = fn; }), setNotFoundHandler: vi.fn((fn) => { callbacks.notFound = fn; }) };
    registerErrorHandling(app);
    const reply = { status: vi.fn(() => reply), send: vi.fn() }; const request = { requestId: 'request-123', method: 'GET', url: '/missing', log: { error: vi.fn() } };
    callbacks.error(new AppError(403, 'NOPE', 'Nope'), request, reply);
    callbacks.error({ statusCode: 429, error: 'rate limited' }, request, reply);
    callbacks.error({ validation: true }, request, reply);
    callbacks.error({ code: 'FST_ERR_CTP_INVALID_JSON' }, request, reply);
    callbacks.error({ code: 'FST_ERR_CTP_INVALID_MEDIA_TYPE' }, request, reply);
    callbacks.error({ code: 'FST_ERR_CTP_BODY_TOO_LARGE' }, request, reply);
    callbacks.error(new Error('unknown'), request, reply);
    callbacks.notFound(request, reply);
    expect(reply.status).toHaveBeenCalled(); expect(reply.send).toHaveBeenCalled(); expect(request.log.error).toHaveBeenCalled();
  });
});
