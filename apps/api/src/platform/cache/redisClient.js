import redis from '@fastify/redis';

export async function registerRedisClient(app, { redisUrl }) {
  await app.register(redis, { url: redisUrl, closeClient: true });
}
