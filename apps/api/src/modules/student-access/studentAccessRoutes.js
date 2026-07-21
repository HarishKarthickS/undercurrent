const parseTokens = (value) => { try { const parsed = JSON.parse(Buffer.from(value ?? '', 'base64url').toString('utf8')); return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []; } catch { return []; } };
const encodeTokens = (tokens) => Buffer.from(JSON.stringify(tokens)).toString('base64url');
const deviceCookie = (config) => ({ httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'lax', path: '/', maxAge: 31_536_000 });
const unlockCookie = (config) => ({ httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'lax', path: '/', maxAge: 43_200 });

export async function registerStudentAccessRoutes(app, { access, config }) {
  app.post('/student/invitations/consume', { config: { rateLimit: { max: config.authRateLimitMax, timeWindow: config.rateLimitWindow } } }, async (request, reply) => {
    const result = await access.consumeInvitation(request.body?.token, request.body?.deviceLabel);
    const tokens = parseTokens(request.cookies?.student_devices);
    reply.setCookie('student_devices', encodeTokens([...new Set([...tokens, result.deviceToken])]), deviceCookie(config));
    return { studentId: result.studentId };
  });
  app.get('/student/device/profiles', async (request) => ({ students: await access.localProfiles(parseTokens(request.cookies?.student_devices)) }));
  app.post('/student/device/pin', { config: { rateLimit: { max: config.authRateLimitMax, timeWindow: config.rateLimitWindow } } }, async (request, reply) => { const result = await access.setPin(parseTokens(request.cookies?.student_devices), request.body); const tokens = parseTokens(request.cookies?.student_unlocks); reply.setCookie('student_unlocks', encodeTokens([...new Set([...tokens, result.unlockToken])]), unlockCookie(config)); return { accepted: true }; });
  app.post('/student/device/unlock', { config: { rateLimit: { max: config.authRateLimitMax, timeWindow: config.rateLimitWindow } } }, async (request, reply) => { const result = await access.unlock(parseTokens(request.cookies?.student_devices), request.body); const tokens = parseTokens(request.cookies?.student_unlocks); reply.setCookie('student_unlocks', encodeTokens([...new Set([...tokens, result.unlockToken])]), unlockCookie(config)); return { student: result.student }; });
}

export async function registerStudentLearningRoutes(app, { access, sessions }) {
  const actors = (request) => ({ devices: parseTokens(request.cookies?.student_devices), unlocks: parseTokens(request.cookies?.student_unlocks) });
  app.post('/student/session/start', async (request) => { const value = actors(request); return sessions.start(await access.studentActor(value.devices, value.unlocks, request.body?.studentId), request.body); });
  app.get('/student/session/:studentId/curiosity-trail', async (request) => { const value = actors(request); return sessions.getCuriosityTrail(await access.studentActor(value.devices, value.unlocks, request.params.studentId), request.params.studentId); });
  app.post('/student/session/turn', async (request) => { const value = actors(request); return sessions.turn(await access.studentActorForSession(value.devices, value.unlocks, request.body?.sessionId), request.body); });
  app.post('/student/session/end', async (request) => { const value = actors(request); return sessions.end(await access.studentActorForSession(value.devices, value.unlocks, request.body?.sessionId), request.body); });
  app.get('/student/:studentId/ritual-home', async (request) => { const value = actors(request); return sessions.home(await access.studentActor(value.devices, value.unlocks, request.params.studentId), request.params.studentId); });
  app.get('/student/:studentId/reflections', async (request) => { const value = actors(request); return sessions.history(await access.studentActor(value.devices, value.unlocks, request.params.studentId), request.params.studentId, request.query?.sessionId); });
  app.get('/student/:studentId/morning-ripples', async (request) => { const value = actors(request); return sessions.morningHistory(await access.studentActor(value.devices, value.unlocks, request.params.studentId), request.params.studentId); });
  app.post('/student/morning-ripple/complete', async (request) => { const value = actors(request); return sessions.completeMorning(await access.studentActorForSession(value.devices, value.unlocks, request.body?.sessionId), request.body); });
}

export async function registerParentStudentAccessRoutes(app, { access }) {
  app.post('/parent/student-access/invitations', async (request, reply) => reply.status(201).send(await access.invite(request.parentSession, request.body)));
  app.get('/parent/students/:studentId/access', async (request) => access.access(request.parentSession, request.params.studentId));
  app.post('/parent/students/:studentId/pin/reset', async (request) => access.resetPin(request.parentSession, request.params.studentId));
  app.delete('/parent/students/:studentId/devices/:deviceId', async (request) => access.revokeDevice(request.parentSession, request.params.studentId, request.params.deviceId));
  app.post('/parent/students/:studentId/devices/revoke-all', async (request) => access.revokeAll(request.parentSession, request.params.studentId));
}
