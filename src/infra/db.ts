import pg from 'pg';

export interface Database {
  /** Resolves if the database answers a trivial query, rejects otherwise. */
  ping(): Promise<void>;
  close(): Promise<void>;
}

export function createDatabase(opts: { connectionString: string; max: number }): Database {
  const pool = new pg.Pool({
    connectionString: opts.connectionString,
    max: opts.max,
    connectionTimeoutMillis: 2_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 5_000,
  });

  // An idle client erroring must not crash the process.
  pool.on('error', () => {});

  return {
    async ping() {
      await pool.query('SELECT 1');
    },
    async close() {
      await pool.end();
    },
  };
}
