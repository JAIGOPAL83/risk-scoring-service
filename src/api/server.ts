import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { Database } from '../infra/db.js';

export interface ServerDeps {
  db: Database;
  logLevel?: string;
}

/**
 * Builds the app without listening, so tests can use `server.inject()`.
 * Keep all I/O dependencies injected through `deps`.
 */
export async function buildServer(deps: ServerDeps): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: deps.logLevel ?? 'info',
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    },
    // Reuse an upstream request ID (e.g. from the ALB) or generate one.
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
  });

  await server.register(helmet);
  await server.register(rateLimit, { max: 300, timeWindow: '1 minute' });

  server.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  // Liveness: the process is up. Must not depend on any downstream system.
  server.get('/healthz', async () => ({ status: 'ok' }));

  // Readiness: the instance can serve traffic, i.e. the database answers.
  server.get('/readyz', async (request, reply) => {
    try {
      await deps.db.ping();
      return { status: 'ready' };
    } catch (err) {
      request.log.error({ err }, 'readiness check failed');
      return reply.code(503).send({ status: 'unavailable' });
    }
  });

  return server;
}
