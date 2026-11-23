# risk-scoring-service

Real-time transaction risk-scoring service. Fastify + TypeScript (strict) + PostgreSQL.

This is the Day 1 scaffold: server, config, DB connectivity, health endpoints, lint, format and tests.

## Requirements

- Node.js 22+
- Docker (for local Postgres)

## Run locally

```bash
cp .env.example .env
docker compose up -d        # Postgres 16 on localhost:5432
npm install
npm run dev                 # http://localhost:3000
```

```bash
curl localhost:3000/healthz   # liveness  -> {"status":"ok"}
curl localhost:3000/readyz    # readiness -> {"status":"ready"} (503 if Postgres is down)
```

## Scripts

| Script                              | What it does                                      |
| ----------------------------------- | ------------------------------------------------- |
| `npm run dev`                       | Start with watch mode, reading `.env`             |
| `npm run build` / `npm start`       | Compile to `dist/` and run                        |
| `npm test`                          | Run Vitest                                        |
| `npm run lint` / `npm run lint:fix` | ESLint (typescript-eslint)                        |
| `npm run format` / `format:check`   | Prettier                                          |
| `npm run typecheck`                 | `tsc --noEmit`                                    |
| `npm run check`                     | Format check, lint, typecheck and tests (CI gate) |

## Layout

```
src/
  api/       HTTP layer: routes, schemas, plugins (thin)
  domain/    Pure business logic, no I/O (rules engine goes here on Day 2)
  infra/     Config, database, external clients
  worker/    Background consumers (Day 3)
test/        Vitest tests
migrations/  SQL migrations (Day 2)
docs/adr/    Architecture decision records
```

## Design notes

- `buildServer(deps)` does not listen, so tests use `server.inject()` and dependencies are injected.
- Config is validated with Zod at startup and fails fast.
- `/healthz` (liveness) has no dependencies; `/readyz` (readiness) checks the database.
- Every response carries an `x-request-id` header; the same ID appears in the logs. Authorization and cookie headers are redacted.
- SIGTERM and SIGINT trigger a graceful shutdown (drain requests, close the DB pool).
- Commits are checked by commitlint (Conventional Commits) and staged files by lint-staged via Husky.
