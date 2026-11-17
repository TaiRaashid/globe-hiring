# Globe Hiring

Globe Hiring is a global company and job discovery platform. Its initial product focuses on reliable company discovery, verified job listings, and geographic exploration.

## Architecture

This repository is a pnpm workspace monorepo:

```text
apps/
  web/       React + TypeScript + Vite frontend
  api/       Fastify REST API
packages/
  shared/    Shared domain types and validation schemas
  database/  PostgreSQL + PostGIS schema, Drizzle ORM and migrations
```

The existing React/MapLibre prototype is preserved in `apps/web`. The Fastify API exposes liveness/readiness endpoints and a public company-list endpoint. Database access is isolated in `packages/database`.

## Requirements

- Node.js 22 or newer
- pnpm 10 or newer
- PostgreSQL 18
- PostGIS 3.7 (enabled in the `globe_hiring` database)

The local development setup uses PostgreSQL installed directly on Windows; Docker is not required.

Enable pnpm using Corepack:

```bash
corepack enable
corepack prepare pnpm@10.34.9 --activate
```

## Install

Run from the repository root:

```bash
pnpm install
```

## Database setup

Create `apps/api/.env` by copying `apps/api/.env.example`, then set `DATABASE_URL` to your local PostgreSQL connection string. Ensure PostGIS is enabled in the target database before applying migrations:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```


Do not commit the `.env` file or share its password. URL-encode reserved characters in the password (for example, `@` becomes `%40`).

Generate and apply the initial migration:

```bash
pnpm db:generate
pnpm db:migrate
```

Import the existing prototype company dataset:

```bash
pnpm db:seed
```

The seed script imports company profiles, headquarters coordinates, industries, founders, investors, benefits, and careers-page URLs. It deliberately does **not** import the prototype job counts or sample job positions as live vacancies. Seeded companies start with `verification_status = 'unverified'`.

Useful database commands:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

Migrations are generated and applied through Drizzle Kit. Do not use `drizzle-kit push` as a substitute for committed migrations.

## Development

Run frontend and API together:

```bash
pnpm dev
```

Or separately:

```bash
pnpm dev:web
pnpm dev:api
```

- Frontend: http://localhost:5173
- API liveness: http://localhost:4000/health
- API database readiness: http://localhost:4000/health/ready
- Public company list: http://localhost:4000/api/companies

The company-list endpoint returns public company profile fields only. It does not return job records or protected job details.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Engineering principles

- The API owns business rules and access control.
- Public API responses must not contain protected job details.
- External job data must retain source attribution and freshness metadata.
- Failed ingestion runs must never be interpreted as proof that every job has expired.
- Database changes are made through versioned migrations.
- Tests are added alongside each feature, not postponed until the end.
