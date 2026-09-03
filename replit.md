# CreatorPulse

CreatorPulse is a YouTube-first creator operating system that turns channel signals into an explainable next move, a verified content package, and a learning loop.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/creatorpulse/src/pages/pages.tsx` — user-facing golden path pages
- `artifacts/creatorpulse/src/components/shell.tsx` — shared command-center shell
- `artifacts/api-server/src/routes/creator.ts` — growth-loop API routes and deterministic engines
- `artifacts/api-server/src/lib/creator-state.ts` — seeded demo channel and persisted Creator Memory state
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/creator-state.ts` — PostgreSQL persistence model
- `README.md` and `docs/architecture.md` — hackathon positioning and architecture

## Architecture decisions

- The first build prioritizes one complete growth loop over broad social-platform coverage.
- Numeric opportunity and QA scores are deterministic and explainable; the demo does not fabricate certainty.
- The demo channel is intentionally labeled as public/demo data, and scheduling is explicitly simulated until platform credentials exist.
- Creator Memory is persisted as a JSONB state row so the feedback loop survives refreshes without overbuilding infrastructure.

## Product

The app analyzes a seeded YouTube-style channel, ranks content opportunities, catches collisions, generates a complete multi-surface package, runs a quality gate, supports creator approval and demo scheduling, records measured performance, and updates future recommendations.

## User preferences

The user wants the product optimized to win the AI Content Engine Hackathon by demonstrating real work, not a static mockup.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- The demo stays usable without an external LLM key; do not label deterministic generation as live model output.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
