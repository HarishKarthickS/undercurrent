export class AppError extends Error { constructor(statusCode, code, message) { super(message); this.statusCode = statusCode; this.code = code; } }
export const errorPayload = (code, message, requestId = undefined) => ({ error: { code, message, ...(requestId ? { requestId } : {}) } });
