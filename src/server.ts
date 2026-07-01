import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";

/**
 * Custom server entry (see vite.config.ts `tanstackStart({ server: { entry } })`).
 * The framework's default entry (`@tanstack/react-start/server-entry`) only
 * exports `{ fetch }`, leaving no room to also export Durable Object classes
 * for wrangler's `main` to find — so this replaces it, re-exporting the same
 * fetch handler alongside PollRoom.
 */
export { PollRoom } from "#/durable-objects/poll-room";

export default {
  fetch: createStartHandler(defaultStreamHandler),
};
