import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../src/api/server.js';
import type { Database } from '../src/infra/db.js';

const healthyDb: Database = { ping: async () => {}, close: async () => {} };
const brokenDb: Database = {
  ping: async () => {
    throw new Error('connection refused');
  },
  close: async () => {},
};

describe('health endpoints', () => {
  let server: FastifyInstance;

  afterEach(async () => {
    await server.close();
  });

  it('GET /healthz returns 200 and a request id header', async () => {
    server = await buildServer({ db: healthyDb, logLevel: 'silent' });
    const res = await server.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('GET /readyz returns 200 when the database answers', async () => {
    server = await buildServer({ db: healthyDb, logLevel: 'silent' });
    const res = await server.inject({ method: 'GET', url: '/readyz' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ready' });
  });

  it('GET /readyz returns 503 when the database is down', async () => {
    server = await buildServer({ db: brokenDb, logLevel: 'silent' });
    const res = await server.inject({ method: 'GET', url: '/readyz' });
    expect(res.statusCode).toBe(503);
  });
});
