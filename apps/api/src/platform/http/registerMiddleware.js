import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import underPressure from '@fastify/under-pressure';
import cookie from '@fastify/cookie';
import csrf from '@fastify/csrf-protection';
import { AppError, errorPayload } from '#api/shared/errors/appError.js';
import { registerRedisClient } from '#api/platform/cache/redisClient.js';
import { registerRequestContext } from './requestContext.js';

export async function registerMiddleware(app, { config, database }) {
  registerRequestContext(app);
  await app.register(cookie);
  await app.register(csrf, {
    cookieOpts: { httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'lax', path: '/' },
    getToken: (request) => request.headers['x-csrf-token']
  });
  app.addHook('onRequest', (request, reply, done) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return done();
    return app.csrfProtection(request, reply, done);
  });
  await app.register(helmet, { contentSecurityPolicy: false });
  await registerRedisClient(app, { redisUrl: config.redisUrl });
  await app.register(rateLimit, {
    global: true, max: config.rateLimitMax, timeWindow: config.rateLimitWindow, redis: app.redis,
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: (request) => ({ statusCode: 429, ...errorPayload('RATE_LIMITED', 'Too many requests. Please try again later.', request.requestId) })
  });
  await app.register(underPressure, {
    maxEventLoopDelay: config.maxEventLoopDelay,
    healthCheckInterval: config.healthCheckInterval,
    healthCheck: async () => { await database.pool.query('SELECT 1'); await app.redis.ping(); return true; },
    pressureHandler: (request, reply) => reply.status(503).send(errorPayload('SERVICE_UNAVAILABLE', 'The service is temporarily unavailable.', request.requestId))
  });
  app.addHook('preValidation', async (request) => {
    if (!['POST', 'PUT', 'PATCH'].includes(request.method)) return;
    const hasBody = Number(request.headers['content-length'] ?? 0) > 0 || Boolean(request.headers['transfer-encoding']);
    if (!hasBody) return;
    const contentType = request.headers['content-type'] ?? '';
    if (!contentType.toLowerCase().startsWith('application/json')) throw new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Requests with a body must use application/json.');
  });
}
