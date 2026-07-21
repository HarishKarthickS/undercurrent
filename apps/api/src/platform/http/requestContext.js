import { randomUUID } from 'node:crypto';

const validRequestId = (value) => typeof value === 'string' && /^[A-Za-z0-9._-]{8,128}$/.test(value);

export function createRequestId(request) {
  const supplied = request.headers['x-request-id'];
  return validRequestId(supplied) ? supplied : randomUUID();
}

export function registerRequestContext(app) {
  app.addHook('onRequest', async (request, reply) => {
    request.requestId = createRequestId(request);
    reply.header('X-Request-Id', request.requestId);
  });
  app.addHook('onResponse', async (request, reply) => {
    request.log.info({ requestId: request.requestId, statusCode: reply.statusCode }, 'request completed');
  });
}
