# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`poll_request` — an anonymous polling app (think "create a poll, share a link, watch live results"). Built on TanStack Start (file-based router, React 19, SSR) deployed to Cloudflare Workers with a D1 (SQLite) database via Drizzle ORM.

## Commands

```bash
npm run dev              # vite dev server on :3000
npm run build             # production build
npm run test               # vitest run (jsdom via vitest.config.ts; passes with no test files)
npm run lint               # oxlint
npm run typecheck          # tsc --noEmit (TypeScript 7)
npm run db:generate        # drizzle-kit: generate a migration from schema.ts
npm run db:push            # push schema directly to D1 (reads .env.local)
npm run db:studio          # drizzle studio (reads .env.local)
npm run deploy              # build + wrangler deploy
```

`db:push` and `db:studio` need `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, `CLOUDFLARE_D1_TOKEN` in `.env.local` (see `drizzle.config.ts`). Production also needs `JWT_SECRET` set via `wrangler secret put JWT_SECRET` — without it the app falls back to an insecure dev secret (`src/lib/auth/identity.ts`).

Tests use a standalone `vitest.config.ts` (plain jsdom, no Cloudflare plugin) because the Cloudflare vite plugin rejects vitest's SSR environment settings.

## Git workflow & releases

- **Branches + PRs only.** `master` is protected by a ruleset (`protect-master`): no direct pushes, squash-merge only, the `checks` CI job must pass, no bypass. Work on a short-lived branch, open a PR, merge when green.
- **CI** (`.github/workflows/ci.yml`) runs lint → typecheck → test on every PR. `build` is intentionally not part of the PR gate.
- **Every merge to `master` is a release.** `.github/workflows/deploy.yml` re-runs lint → typecheck → test, then builds and runs `wrangler deploy` (needs the `CLOUDFLARE_API_TOKEN` repo secret). No tags, no versioning — `git log master` is the release history.
- **Schema changes are manual and come first:** run `npm run db:push` (and verify) *before* merging a PR that changes `src/db/schema.ts`. The deploy workflow does not touch the database. When a dev/prod database split happens, graduate to committed drizzle migrations applied by the deploy workflow (`drizzle-kit generate` + `wrangler d1 migrations apply`).
- The deployed Worker currently shares `dev-poll-request-db` with local dev — there is no separate production database yet.

## Architecture

**Domain model (`src/db/schema.ts`):** Poll is the aggregate root; `pollOptions` and `votes` belong to it. The schema stores facts only — no `status` column (state is derived from `expiresAt`/`deletedAt`) and no vote counters (totals are computed from `votes` rows on read). Soft-delete via `deletedAt`.

**Layering**, in call order from an API route:
1. `src/routes/api/*.ts` — TanStack Start file routes with `server.handlers`. Thin: resolve identity/cookie, parse request, call into `domain/poll-service.ts`, map result/errors to a `Response`.
2. `src/domain/poll-service.ts` — all business logic and input validation (hand-rolled parsing, not a schema library). Owns authorization (`canManagePoll`/`assertCanManage`) and orchestrates repository calls.
3. `src/domain/poll-projector.ts` — pure function (`projectPollView`) that builds the single API-facing shape (`PollView`) from persisted entities + viewer context. **This is where result-visibility is enforced**: vote counts/percentages are `null` until the viewer has voted or the poll has expired. Never let counts leak elsewhere.
4. `src/db/repositories/poll-repository.ts` — data access only (Drizzle core query builder against tables, not `db.query`). No business rules here.

`PollView` (`src/lib/poll/contracts.ts`) is the *only* shape returned by the API — internal entities (`Poll`, `PollOption`, `Vote`) are never serialized directly to clients.

**Identity, not auth (`src/lib/auth/`):** Every visitor gets an anonymous identity the first time they hit an API that needs one — a signed JWT (`sub`) in an HttpOnly cookie (`pr_identity`), minted via `ensureIdentity()`. This same identity is used both to dedupe votes (`UNIQUE(pollId, voterToken)`) and to recognize a poll's creator as its manager (`poll.creatorId === identitySub`). A per-poll `managementKey` (returned once, in `manageUrl` at creation) is the backup path for managing a poll from another browser. JWT signing is a minimal hand-rolled HS256 implementation on WebCrypto (`src/lib/auth/jwt.ts`) — no external JWT library, by design (Workers runtime, zero deps).

**Live updates:** `GET /api/polls/{publicId}/events` is an SSE stream, forwarded to a `PollRoom` Durable Object (`src/durable-objects/poll-room.ts`, one per poll keyed by `publicId`). The DO holds open connections in memory only — D1 stays the source of truth. `poll-service` pings it after every mutation (`notifyPollChanged`), and each connection re-projects `PollView` with its own identity, sending only when the payload changed. The DO also owns poll closing: a storage alarm armed at `expiresAt` (`schedulePollClose`, re-armed on expiry updates, cancelled on delete) fires `alarm()` → `notifyChange()`, pushing the closing snapshot the moment the poll expires. The frontend (`src/components/poll-view/usePoll.ts`) only opens this stream once results become visible to the viewer (voted or expired), since the EventSource can't carry the management-key header — `canManage` is pinned from the last keyed load and re-applied to every SSE frame client-side.

**Errors:** Domain code throws `HttpError` subtypes (`badRequest`/`notFound`/`forbidden`/`conflict` in `src/lib/errors.ts`); route handlers always catch and convert via `toErrorResponse()`.

**Frontend:** `src/components/create-poll/` (poll creation form + live preview) and `src/components/poll-view/` (voting/results/management UI) are the two main feature areas, each with their own typed API client/hook (`poll-view/api.ts`, `poll-view/usePoll.ts`). Routes under `src/routes/polls.*.tsx` are thin wrappers around these components. `src/routeTree.gen.ts` is generated by the TanStack Router plugin — don't hand-edit it (regenerate via `npm run generate-routes` or just let `vite dev`/`vite build` regenerate it).

**IDs:** internal `id` (UUID) is never exposed; `publicId` and `managementKey` are high-entropy tokens from `src/lib/ids.ts` used in URLs/headers.

## Conventions worth knowing

- Path alias: import app code as `#/...` (maps to `./src/*`; see `imports` in `package.json` and `paths` in `tsconfig.json`). A `@/*` alias also resolves to the same place but `#/` is what's actually used throughout.
- Timestamps are stored as epoch ms (`timestamp_ms` mode) and surface as JS `Date` in TypeScript; API responses serialize them to ISO strings in the projector.
- D1 batch writes (`db.batch([...])`) are used for the only multi-table atomic write (poll + its options on creation).
