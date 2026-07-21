import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabaseClient } from '#api/platform/database/client.js';
import { createRepositories } from '#api/platform/database/repositories/index.js';
import { createIdentityService, registerIdentityRoutes } from '#api/modules/identity/index.js';
import { createStudentsService, registerStudentRoutes } from '#api/modules/students/index.js';
import { createSessionsService, registerSessionRoutes } from '#api/modules/sessions/index.js';
import { createParentDashboardService, registerParentDashboardRoutes } from '#api/modules/parent-dashboard/index.js';
import { registerAuthenticatedRoutes } from '#api/platform/http/authPlugin.js';
import { registerErrorHandling } from '#api/platform/http/errorHandler.js';
import { registerMiddleware } from '#api/platform/http/registerMiddleware.js';
import { responseSchemas } from '#api/platform/http/validation.js';
import { createLearningAgents } from '#api/modules/ai/learningAgents.js';
import { createEncryptionService } from '#api/platform/security/encryption.js';
import { createMailer } from '#api/platform/notifications/mailer.js';
import { createStudentAccessService, registerParentStudentAccessRoutes, registerStudentAccessRoutes, registerStudentLearningRoutes } from '#api/modules/student-access/index.js';
import { createPrivacyService, registerPrivacyRoutes } from '#api/modules/privacy/index.js';

const statusSchema = { type: 'object', additionalProperties: false, required: ['status'], properties: { status: { type: 'string' } } };
const webDist = resolve(dirname(fileURLToPath(import.meta.url)), '../../../web/dist');

function withinWebDist(path) {
  const requested = resolve(webDist, path);
  return !relative(webDist, requested).startsWith('..') ? requested : null;
}

export async function createServer({ config }) {
  if (config.deploymentMode !== 'closed_demo') throw new Error('Only DEPLOYMENT_MODE=closed_demo is supported. Public child enrollment is disabled.');
  if (config.nodeEnv === 'production' && config.enableDevFixtures) throw new Error('ENABLE_DEV_FIXTURES must be disabled in production.');
  if (config.nodeEnv === 'production' && !config.demoTermsSha256) throw new Error('DEMO_TERMS_SHA256 is required in production.');
  const database = createDatabaseClient({ connectionString: config.databaseUrl });
  const app = Fastify({
    logger: config.nodeEnv === 'test' ? false : { redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'] },
    trustProxy: config.trustProxy,
    bodyLimit: config.bodyLimit,
    requestTimeout: config.requestTimeout,
    connectionTimeout: config.connectionTimeout,
    keepAliveTimeout: config.keepAliveTimeout,
    requestIdHeader: false
  });
  const repositories = createRepositories(database.db);
  const mailer = createMailer({ smtpUrl: config.smtpUrl, from: config.mailFrom, publicAppUrl: config.publicAppUrl });
  const identity = createIdentityService({ repositories, mailer, config });
  const students = createStudentsService({ repositories, config });
  const agents = createLearningAgents({ apiKey: config.openaiApiKey, model: config.openaiModel, baseURL: config.openaiBaseUrl, timeout: config.aiRequestTimeout });
  const encryption = config.encryptionKey ? createEncryptionService({ key: config.encryptionKey, keyVersion: config.encryptionKeyVersion }) : null;
  const sessions = createSessionsService({ repositories, agents, encryption, config, notifySafety: (event) => mailer.sendSafetyAlert(event) });
  const dashboard = createParentDashboardService({ repositories, agents, encryption, config });
  const studentAccess = createStudentAccessService({ repositories, mailer });
  const privacy = createPrivacyService({ repositories });

  await registerMiddleware(app, { config, database });
  registerErrorHandling(app);
  app.addHook('onClose', () => database.close());

  app.get('/health', { schema: { response: responseSchemas(statusSchema) } }, async () => ({ status: 'ok' }));
  app.get('/ready', { schema: { response: { 200: statusSchema, 503: statusSchema } } }, async (_request, reply) => {
    try { await database.pool.query('SELECT 1'); await app.redis.ping(); return { status: 'ready' }; }
    catch { return reply.status(503).send({ status: 'not_ready' }); }
  });
  await registerIdentityRoutes(app, { identity, config });
  await registerStudentAccessRoutes(app, { access: studentAccess, config });
  await registerStudentLearningRoutes(app, { access: studentAccess, sessions });
  await registerAuthenticatedRoutes(app, {
    identity,
    registerRoutes: async (protectedApp) => {
      await registerStudentRoutes(protectedApp, { students });
      await registerSessionRoutes(protectedApp, { sessions });
      await registerParentDashboardRoutes(protectedApp, { dashboard });
      await registerParentStudentAccessRoutes(protectedApp, { access: studentAccess });
      await registerPrivacyRoutes(protectedApp, { privacy });
    }
  });
  if (config.nodeEnv === 'production') {
    if (!existsSync(webDist)) throw new Error('The production web build is missing. Run npm run build before starting the API.');
    await app.register(fastifyStatic, { root: webDist, serve: false });
    app.get('/*', async (request, reply) => {
      const requested = withinWebDist(request.params['*']);
      if (requested && existsSync(requested)) return reply.sendFile(request.params['*']);
      return reply.type('text/html').sendFile('index.html');
    });
  }
  return app;
}
