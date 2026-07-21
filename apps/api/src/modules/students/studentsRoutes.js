import { responseSchemas } from '#api/platform/http/validation.js';
import { createStudentBodySchema, studentSchema } from './studentsSchemas.js';

export async function registerStudentRoutes(app, { students }) {
  app.get('/students', { schema: { response: responseSchemas({ type: 'object', additionalProperties: false, required: ['students'], properties: { students: { type: 'array', items: studentSchema } } }) } }, async (request) => ({ students: await students.list(request.parentSession) }));
  app.post('/students', { schema: { body: createStudentBodySchema, response: responseSchemas({ type: 'object', additionalProperties: false, required: ['student'], properties: { student: studentSchema } }) } }, async (request, reply) => reply.status(201).send({ student: await students.create(request.parentSession, request.body) }));
}
