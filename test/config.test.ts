import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/infra/config.js';

describe('loadConfig', () => {
  it('applies defaults and parses numbers', () => {
    const cfg = loadConfig({ DATABASE_URL: 'postgres://app:app@localhost:5432/risk' });
    expect(cfg.PORT).toBe(3000);
    expect(cfg.DB_POOL_MAX).toBe(10);
  });

  it('fails fast when DATABASE_URL is missing', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
  });
});
