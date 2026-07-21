const params = { type: 'object', additionalProperties: false, required: ['studentId'], properties: { studentId: { type: 'string', format: 'uuid' } } };

export async function registerPrivacyRoutes(app, { privacy }) {
  app.get('/parent/students/:studentId/export', { schema: { params } }, async (request) => privacy.exportStudent(request.parentSession, request.params.studentId));
  app.post('/parent/students/:studentId/withdraw', { schema: { params } }, async (request) => privacy.withdrawStudent(request.parentSession, request.params.studentId));
  app.delete('/parent/students/:studentId', { schema: { params } }, async (request) => privacy.deleteStudent(request.parentSession, request.params.studentId));
}
