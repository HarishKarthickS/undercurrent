import { describe, expect, it, vi } from 'vitest';
import { errorPayload } from '../../apps/api/src/shared/errors/appError.js';
import { createRequestId } from '../../apps/api/src/platform/http/requestContext.js';
import { registerErrorHandling } from '../../apps/api/src/platform/http/errorHandler.js';

describe('HTTP middleware primitives', () => {
  it('preserves a safe client request ID and rejects unsafe values', () => {
    expect(createRequestId({ headers: { 'x-request-id': 'request_1234' } })).toBe('request_1234');
    expect(createRequestId({ headers: { 'x-request-id': '<script>' } })).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('includes request IDs in public error payloads', () => {
    expect(errorPayload('NOT_FOUND', 'Missing.', 'request_1234')).toEqual({ error: { code: 'NOT_FOUND', message: 'Missing.', requestId: 'request_1234' } });
  });

  it('maps Fastify unsupported-media errors to a safe 415 payload', () => {
    const app = { setErrorHandler: (handler) => { app.handler = handler; }, setNotFoundHandler: () => undefined };
    registerErrorHandling(app);
    const reply = { status: vi.fn(() => reply), send: vi.fn() };
    app.handler({ code: 'FST_ERR_CTP_INVALID_MEDIA_TYPE' }, { requestId: 'request_1234', log: { error: vi.fn() } }, reply);
    expect(reply.status).toHaveBeenCalledWith(415);
    expect(reply.send).toHaveBeenCalledWith({ error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Requests with a body must use application/json.', requestId: 'request_1234' } });
  });
});
