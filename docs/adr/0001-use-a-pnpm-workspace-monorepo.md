# ADR 0001: Use a pnpm workspace monorepo

- Status: Accepted
- Date: 2026-11-13

## Context

Globe Hiring currently has a single Vite frontend. The product needs a separately testable HTTP API, shared domain contracts, and a database package. Keeping all code in one frontend application would blur browser, server, and persistence boundaries. Splitting everything into independently deployed repositories would add coordination overhead too early.

## Decision

Use a pnpm workspace monorepo with `apps/web`, `apps/api`, and focused packages under `packages/`.

## Consequences

- Frontend and API can be developed and deployed independently.
- Shared contracts can be imported without duplicating domain definitions.
- A single repository keeps changes to API contracts and frontend consumers coordinated.
- Workspace tooling and package boundaries require discipline; packages should be introduced only when they have a clear responsibility.
- This is a modular monolith architecture, not a microservices architecture.
