import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

/**
 * GET /api/polls/{publicId}/events — Server-Sent Events stream.
 *
 * Forwarded straight to the poll's PollRoom Durable Object (one per poll,
 * keyed by publicId), which owns the open connections and pushes a fresh
 * PollView snapshot whenever the poll actually changes — see
 * `src/durable-objects/poll-room.ts`.
 */
export const Route = createFileRoute("/api/polls/$publicId/events")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        return env.POLL_ROOM.getByName(params.publicId).fetch(request);
      },
    },
  },
});
