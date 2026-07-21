import { responseSchemas } from '#api/platform/http/validation.js';
import { curiosityTrailParamsSchema, endSessionSchema, startSessionSchema, turnSessionSchema } from './sessionsSchemas.js';

export async function registerSessionRoutes(app, { sessions }) {
  app.post('/session/start', { schema: { ...startSessionSchema, response: responseSchemas({ type: 'object', additionalProperties: true, required: ['sessionId', 'sessionType', 'openingPrompt'], properties: { sessionId: { type: 'string' }, sessionType: { type: 'string' }, openingPrompt: { type: 'string' } } }) } }, async (request) => sessions.start(request.parentSession, request.body));
  app.get('/session/:studentId/curiosity-trail', { schema: { params: curiosityTrailParamsSchema, response: responseSchemas({ type: 'object', additionalProperties: false, required: ['days'], properties: { days: { type: 'array', minItems: 7, maxItems: 7, items: { type: 'object', additionalProperties: false, required: ['date', 'completed'], properties: { date: { type: 'string', format: 'date' }, completed: { type: 'boolean' } } } } } }) } }, async (request) => sessions.getCuriosityTrail(request.parentSession, request.params.studentId));
  app.post('/session/turn', { schema: { ...turnSessionSchema, response: responseSchemas({ type: 'object', additionalProperties: false, required: ['message', 'terminal'], properties: { message: { type: 'string' }, terminal: { type: 'boolean' }, parentNotification: { type: 'boolean' } } }) } }, async (request) => sessions.turn(request.parentSession, request.body));
  app.post('/session/end', { schema: { ...endSessionSchema, response: responseSchemas({ type: 'object', additionalProperties: false, required: ['ok'], properties: { ok: { type: 'boolean' } } }) } }, async (request) => sessions.end(request.parentSession, request.body));
  app.get('/parent/students/:studentId/ritual-settings', async (request) => sessions.getSettings(request.parentSession, request.params.studentId));
  app.put('/parent/students/:studentId/ritual-settings', async (request) => sessions.saveSettings(request.parentSession, request.params.studentId, request.body));
  app.get('/parent/students/:studentId/reflections', async (request) => sessions.history(request.parentSession, request.params.studentId, request.query?.sessionId));
  app.get('/parent/students/:studentId/conversations', async (request) => sessions.conversations(request.parentSession, request.params.studentId));
  app.get('/parent/students/:studentId/conversations/:sessionId', async (request) => sessions.conversation(request.parentSession, request.params.studentId, request.params.sessionId));
  app.get('/parent/students/:studentId/morning-ripples', async (request) => sessions.morningHistory(request.parentSession, request.params.studentId));
}
