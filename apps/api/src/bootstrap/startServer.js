import 'dotenv/config';
import { loadConfig } from '#api/config/env.js';
import { createServer } from '#api/bootstrap/createServer.js';

const config = loadConfig();
const app = await createServer({ config });
await app.listen({ host: '0.0.0.0', port: config.port });
