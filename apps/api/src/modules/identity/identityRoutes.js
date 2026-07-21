import { guardianInviteSchema, loginSchema, resetCompleteSchema, resetRequestSchema, signupSchema, termsSchema, verifySchema } from './identitySchemas.js';

const cookieOptions = (config, expiresAt) => ({ httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'lax', path: '/', expires: expiresAt });
const clearCookieOptions = (config) => ({ httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'lax', path: '/' });

export async function registerIdentityRoutes(app, { identity, config }) {
  app.get('/auth/csrf', async (_request, reply) => ({ token: await reply.generateCsrf() }));
  app.post('/auth/signup', { schema: signupSchema, config: { rateLimit: { max: config.authRateLimitMax, timeWindow: config.rateLimitWindow } } }, async (request, reply) => reply.status(202).send(await identity.signup(request.body)));
  app.post('/auth/verify-email', { schema: verifySchema, config: { rateLimit: { max: config.authRateLimitMax, timeWindow: config.rateLimitWindow } } }, async (request, reply) => {
    const session = await identity.verifyEmail(request.body);
    reply.setCookie('parent_session', session.token, cookieOptions(config, session.expiresAt));
    return reply.send({ parent: session.parent, household: session.household });
  });
  app.post('/auth/verification/resend', { schema: resetRequestSchema, config: { rateLimit: { max: config.authRateLimitMax, timeWindow: config.rateLimitWindow } } }, async (request) => identity.resendVerification(request.body));
  app.post('/auth/login', { schema: loginSchema, config: { rateLimit: { max: config.authRateLimitMax, timeWindow: config.rateLimitWindow } } }, async (request, reply) => {
    const session = await identity.login(request.body);
    reply.setCookie('parent_session', session.token, cookieOptions(config, session.expiresAt));
    return reply.send({ parent: session.parent, household: session.household });
  });
  app.post('/auth/password-reset/request', { schema: resetRequestSchema, config: { rateLimit: { max: config.authRateLimitMax, timeWindow: config.rateLimitWindow } } }, async (request) => identity.requestPasswordReset(request.body));
  app.post('/auth/password-reset/complete', { schema: resetCompleteSchema, config: { rateLimit: { max: config.authRateLimitMax, timeWindow: config.rateLimitWindow } } }, async (request) => identity.resetPassword(request.body));
  app.get('/auth/session', async (request) => identity.session(request.cookies?.parent_session));
  app.post('/auth/logout', async (request, reply) => { await identity.logout(request.cookies?.parent_session); reply.clearCookie('parent_session', clearCookieOptions(config)); return { accepted: true }; });
  app.post('/auth/terms', { schema: termsSchema }, async (request) => identity.acceptDemoTerms(await identity.requireParent(request), request.body));
  app.get('/auth/sessions', async (request) => identity.listSessions(await identity.requireParent(request)));
  app.post('/auth/sessions/revoke-all', async (request, reply) => { const result = await identity.revokeAllSessions(await identity.requireParent(request)); reply.clearCookie('parent_session', clearCookieOptions(config)); return result; });
  app.post('/auth/guardian-invitations', { schema: guardianInviteSchema }, async (request, reply) => reply.status(201).send(await identity.inviteGuardian(await identity.requireParent(request), request.body)));
  app.get('/auth/guardian-invitations', async (request) => identity.listGuardianInvitations(await identity.requireParent(request)));
}
