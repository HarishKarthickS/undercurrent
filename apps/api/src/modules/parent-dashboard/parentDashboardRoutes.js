import { responseSchemas } from '#api/platform/http/validation.js';
import { parentDashboardParamsSchema } from './parentDashboardSchemas.js';

export async function registerParentDashboardRoutes(app, { dashboard }) {
  app.get('/parent/:studentId/dashboard', { schema: { params: parentDashboardParamsSchema, response: responseSchemas({ type: 'object', additionalProperties: true }) } }, async (request) => dashboard.get(request.parentSession, request.params.studentId));
  app.put('/parent/:studentId/experience', { schema: { params: parentDashboardParamsSchema, response: responseSchemas({ type: 'object', additionalProperties: true }) } }, async (request) => dashboard.updateChild(request.parentSession, request.params.studentId, request.body ?? {}));
  app.put('/parent/experience/household', { schema: { response: responseSchemas({ type: 'object', additionalProperties: true }) } }, async (request) => dashboard.updateHousehold(request.parentSession, request.body ?? {}));
  app.post('/parent/product-events', async (request) => dashboard.recordProductEvent(request.parentSession, request.body));
  app.post('/parent/:studentId/safety/:eventId/acknowledge', async (request) => dashboard.acknowledgeSafety(request.parentSession, request.params.studentId, request.params.eventId));
  app.get('/parent/:studentId/topics/:topicId', async (request) => dashboard.topic(request.parentSession, request.params.studentId, request.params.topicId));
  app.get('/parent/:studentId/advisor/history', async (request) => dashboard.advisorHistory(request.parentSession, request.params.studentId));
  app.delete('/parent/:studentId/advisor/history', async (request) => dashboard.clearAdvisorHistory(request.parentSession, request.params.studentId));
  app.post('/parent/:studentId/advisor/turn', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (request) => dashboard.advisorTurn(request.parentSession, request.params.studentId, request.body));
}
