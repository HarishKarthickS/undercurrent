export const parentDashboardParamsSchema = { type: 'object', additionalProperties: false, required: ['studentId'], properties: { studentId: { type: 'string', format: 'uuid' } } };
