const required = (value, name) => {
  if (!value?.trim()) throw new Error(`${name} is required.`);
  return value.trim();
};
const positiveInteger = (value, fallback, name) => {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} must be a positive integer.`);
  return parsed;
};
const boolean = (value, fallback = false) => value == null ? fallback : value === 'true';

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) throw new Error('NODE_ENV must be development, test, or production.');
  return Object.freeze({
    nodeEnv,
    deploymentMode: env.DEPLOYMENT_MODE ?? 'closed_demo',
    enableDevFixtures: boolean(env.ENABLE_DEV_FIXTURES),
    demoTermsVersion: env.DEMO_TERMS_VERSION?.trim() || 'closed-demo-v1',
    demoTermsSha256: env.DEMO_TERMS_SHA256?.trim() || null,
    port: Number(env.PORT ?? 3001),
    databaseUrl: required(env.DATABASE_URL, 'DATABASE_URL'),
    redisUrl: required(env.REDIS_URL ?? 'redis://localhost:6379', 'REDIS_URL'),
    trustProxy: env.TRUST_PROXY === 'true',
    bodyLimit: positiveInteger(env.BODY_LIMIT_BYTES, 16_384, 'BODY_LIMIT_BYTES'),
    requestTimeout: positiveInteger(env.REQUEST_TIMEOUT_MS, 30_000, 'REQUEST_TIMEOUT_MS'),
    keepAliveTimeout: positiveInteger(env.KEEP_ALIVE_TIMEOUT_MS, 72_000, 'KEEP_ALIVE_TIMEOUT_MS'),
    connectionTimeout: positiveInteger(env.CONNECTION_TIMEOUT_MS, 10_000, 'CONNECTION_TIMEOUT_MS'),
    openaiApiKey: env.OPENAI_API_KEY?.trim() || null,
    openaiBaseUrl: env.OPENAI_BASE_URL?.trim() || null,
    openaiModel: env.OPENAI_MODEL?.trim() || 'gpt-5.6',
    aiRequestTimeout: positiveInteger(env.AI_REQUEST_TIMEOUT_MS, 8_000, 'AI_REQUEST_TIMEOUT_MS'),
    aiDailyTurnLimit: positiveInteger(env.AI_DAILY_TURN_LIMIT, 24, 'AI_DAILY_TURN_LIMIT'),
    parentAdvisorDailyTurnLimit: positiveInteger(env.PARENT_ADVISOR_DAILY_TURN_LIMIT, 12, 'PARENT_ADVISOR_DAILY_TURN_LIMIT'),
    encryptionKey: env.ENCRYPTION_KEY?.trim() || null,
    encryptionKeyVersion: env.ENCRYPTION_KEY_VERSION?.trim() || 'v1',
    smtpUrl: env.SMTP_URL?.trim() || null,
    mailFrom: env.MAIL_FROM?.trim() || 'Undercurrent <no-reply@localhost>',
    publicAppUrl: env.PUBLIC_APP_URL?.trim() || 'http://localhost:5173',
    rateLimitMax: positiveInteger(env.RATE_LIMIT_MAX_REQUESTS, 100, 'RATE_LIMIT_MAX_REQUESTS'),
    authRateLimitMax: positiveInteger(env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10, 'AUTH_RATE_LIMIT_MAX_REQUESTS'),
    rateLimitWindow: env.RATE_LIMIT_WINDOW_MS ?? '1 minute',
    maxEventLoopDelay: positiveInteger(env.MAX_EVENT_LOOP_DELAY_MS, 1_000, 'MAX_EVENT_LOOP_DELAY_MS'),
    healthCheckInterval: positiveInteger(env.HEALTH_CHECK_INTERVAL_MS, 5_000, 'HEALTH_CHECK_INTERVAL_MS')
  });
}
