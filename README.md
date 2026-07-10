# Poll Request

An anonymous, real-time polling app for settling team decisions without an account or a long thread. Create a poll, share its link, and watch results update live.

Built with TanStack Start, React, Cloudflare Workers, D1, Drizzle ORM, and Durable Objects.

## Features

- Create a single-choice poll with 2–10 options and a 1-, 3-, or 24-hour lifetime.
- Share a public voting link and a separate management link.
- Vote anonymously; one browser identity can change its vote.
- Keep vote totals hidden until a visitor votes or the poll closes.
- Stream result changes to eligible viewers with Server-Sent Events and a Durable Object per poll.
- Manage a poll from its creator browser or with the management key in the management URL.
- Browse polls created from the current browser in **My polls**.

> Save the management URL when creating a poll. Its key is returned only once and is the recovery path for managing the poll from another browser.

## Stack

- [TanStack Start](https://tanstack.com/start) and [React](https://react.dev/)
- [Cloudflare Workers](https://workers.cloudflare.com/), D1, and Durable Objects
- [Drizzle ORM](https://orm.drizzle.team/) with SQLite/D1
- Tailwind CSS

## Prerequisites

- Node.js 20+
- A Cloudflare account with a D1 database for development/deployment

## Local development

Install dependencies:

```bash
npm install
```

The Drizzle commands read Cloudflare credentials from `.env.local`. Create that file locally (do not commit it):

```dotenv
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_DATABASE_ID=your-d1-database-id
CLOUDFLARE_D1_TOKEN=your-cloudflare-api-token
```

Ensure the D1 binding in `wrangler.jsonc` points at that database, then apply the schema:

```bash
npm run db:push
```

Start the app at [http://localhost:3000](http://localhost:3000):

```bash
npm run dev
```

The app uses an insecure built-in JWT secret in development. Set a real `JWT_SECRET` before deploying.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Run the Vite development server on port 3000. |
| `npm run build` | Create a production build. |
| `npm run preview` | Preview the production build. |
| `npm run test` | Run the Vitest suite. |
| `npm run generate-routes` | Regenerate TanStack Router routes. |
| `npm run db:generate` | Generate a Drizzle migration from the schema. |
| `npm run db:push` | Push the Drizzle schema to D1. |
| `npm run db:studio` | Open Drizzle Studio for the configured D1 database. |
| `npm run deploy` | Build and deploy to Cloudflare Workers. |

## Deploying

1. Create or select a Cloudflare D1 database and update its binding in `wrangler.jsonc`.
2. Configure `.env.local` with credentials and run `npm run db:push` to apply the schema.
3. Authenticate Wrangler if needed:

   ```bash
   npx wrangler login
   ```

4. Set the production identity-signing secret:

   ```bash
   npx wrangler secret put JWT_SECRET
   ```

5. Deploy:

   ```bash
   npm run deploy
   ```

`wrangler.jsonc` also declares the `POLL_ROOM` Durable Object binding and its migration. Keep that binding and migration configuration in place: it powers the live result stream and expiry alarms.

## How it works

Every visitor receives an anonymous, signed `pr_identity` HttpOnly cookie when they use a poll API. That identity is used to enforce one vote per poll and to recognize the poll creator. No user account is required.

A poll has two URLs:

- **Share URL** — public; anyone with it can vote.
- **Management URL** — contains a high-entropy management key and unlocks editing or deletion outside the creator browser.

D1 is the source of truth for polls, options, and votes. Each poll also has a Durable Object that holds active SSE connections, publishes changed poll views after mutations, and uses an alarm to push the final results when a poll expires.

## API overview

All poll responses use the `PollView` projection rather than exposing database rows directly. Counts and percentages are `null` until the viewer has voted or the poll has expired.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/polls` | Create a poll. Returns the poll, share URL, and one-time management URL. |
| `GET /api/polls` | List polls created by the current browser identity. |
| `GET /api/polls/:publicId` | Fetch a poll view. |
| `PATCH /api/polls/:publicId` | Update title, description, or expiry. Requires creator identity or `X-Poll-Management-Key`. |
| `DELETE /api/polls/:publicId` | Soft-delete a poll. Requires manager access. |
| `POST /api/polls/:publicId/vote` | Cast or change the current browser's vote. |
| `GET /api/polls/:publicId/events` | Open the Server-Sent Events stream for live updates. |

## Project layout

```text
src/
├── components/          # Create-poll, poll-view, and My Polls UI
├── db/                  # Drizzle schema and repositories
├── domain/              # Validation, authorization, and PollView projection
├── durable-objects/     # Per-poll SSE room and expiration alarm
├── lib/auth/            # Anonymous identity cookie and JWT implementation
└── routes/              # TanStack file routes and API handlers
```

The API handlers stay thin: they resolve identity and HTTP concerns, then call the domain service. Result-visibility rules live in `src/domain/poll-projector.ts`, so vote counts are never exposed accidentally by another endpoint.
