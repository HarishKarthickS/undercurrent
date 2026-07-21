import { AppError, errorPayload } from '#api/shared/errors/appError.js';

export function registerErrorHandling(app) {
  app.setErrorHandler((error, request, reply) => {
    const requestId = request.requestId;
    if (error instanceof AppError) return reply.status(error.statusCode).send(errorPayload(error.code, error.message, requestId));
    if (error.statusCode === 429 && error.error) return reply.status(429).send(error);
    if (error.validation) return reply.status(400).send(errorPayload('VALIDATION_ERROR', 'Request data is invalid.', requestId));
    if (error.code === 'FST_ERR_CTP_INVALID_JSON') return reply.status(400).send(errorPayload('INVALID_JSON', 'Request body must be valid JSON.', requestId));
    if (error.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE') return reply.status(415).send(errorPayload('UNSUPPORTED_MEDIA_TYPE', 'Requests with a body must use application/json.', requestId));
    if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') return reply.status(413).send(errorPayload('PAYLOAD_TOO_LARGE', 'Request body exceeds the allowed size.', requestId));
    if (String(error.code ?? '').includes('CSRF')) return reply.status(403).send(errorPayload('CSRF_INVALID', 'Refresh the page and try again.', requestId));
    request.log.error({ err: error, requestId }, 'request failed');
    return reply.status(500).send(errorPayload('INTERNAL_ERROR', 'The service could not complete that request.', requestId));
  });
  app.setNotFoundHandler((request, reply) => reply.status(404).send(errorPayload('NOT_FOUND', `No route matches ${request.method} ${request.url}.`, request.requestId)));
}
