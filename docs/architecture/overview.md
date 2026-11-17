# Architecture overview

## Current foundation

- `apps/web`: existing React 19, TypeScript, Vite, Tailwind CSS, Radix UI, and MapLibre application.
- `apps/api`: Fastify HTTP server with liveness, database-readiness, and public company-list endpoints.
- `packages/shared`: reserved for runtime schemas and shared domain contracts.
- `packages/database`: PostgreSQL/PostGIS schema, Drizzle ORM client, migration configuration, and prototype-data seed script.

## Intended request flow

```text
Browser (React)
    |
    | HTTPS / JSON
    v
Fastify API
    |-- authentication and authorization
    |-- validation and domain services
    |
    v
PostgreSQL + PostGIS

Scheduled ingestion worker ---> provider adapters ---> validation/reconciliation ---> PostgreSQL
```

## Database model (initial milestone)

- `companies`: public company profile, funding summary, careers URL, and verification status.
- `company_locations`: one or more office locations, including a generated PostGIS point and GiST index.
- `industries` / `company_industries`: normalized industry tags.
- `company_founders`: company founder profiles.
- `investors` / `company_investors`: normalized investor names and relationships.
- `benefits` / `company_benefits`: normalized employee benefits.

The existing prototype dataset is imported as unverified company data. Its sample job counts and sample positions are not imported as live vacancies. Job ingestion and protected job APIs are a later milestone.

## Boundary rules

1. The browser never connects directly to the application database.
2. The API owns business rules and authorization decisions.
3. Public company data and protected job details use separate response schemas.
4. External provider payloads are normalized before persistence.
5. Every imported record retains source and freshness metadata.
6. Database changes are versioned migrations.
7. Failed ingestion runs are operational failures, not evidence that source records have disappeared.

## Current implementation status

The web prototype remains unchanged. The API exposes `GET /health`, `GET /health/ready`, and `GET /api/companies`. Database schema and seed logic are defined in `packages/database`; the first migration is generated locally with `pnpm db:generate` and applied with `pnpm db:migrate`.
