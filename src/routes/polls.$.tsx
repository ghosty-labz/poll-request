import { createFileRoute } from "@tanstack/react-router";
import { PollNotFound } from "#/components/poll-view/PollNotFound";

/**
 * Catch-all for `/polls/*` URLs that match no real route (e.g. a stray extra
 * path segment). More specific routes — `/polls/new`, `/polls/$publicId` — win
 * over this splat; only genuinely unmatched paths land here.
 */
export const Route = createFileRoute("/polls/$")({ component: PollNotFound });
