import { createFileRoute } from "@tanstack/react-router";

import { ensureIdentity } from "#/lib/auth/identity";
import { createPoll, listMyPolls } from "#/domain/poll-service";
import { toErrorResponse } from "#/lib/errors";
import { json, readJson, requestOrigin } from "#/lib/http";
import type { ListMyPollsResponse } from "#/lib/poll/contracts";

/**
 * POST /api/polls — Create Poll (aggregate root action).
 *
 * Client submits the entire poll (title, optional description, expiration,
 * options) in one atomic request. Default expiration is now + 36h.
 *
 * Returns CreatePollResponse: { poll: PollView, shareUrl, manageUrl }.
 * The management key is returned here only (inside manageUrl).
 *
 * GET /api/polls — the polls created by this browser's identity, newest
 * first, as ListMyPollsResponse. Cookie-only: no management-key path.
 */
export const Route = createFileRoute("/api/polls")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { identity, setCookie } = await ensureIdentity(request);
          const polls = await listMyPolls(identity.sub);

          const headers = new Headers();
          if (setCookie) headers.append("set-cookie", setCookie);
          return json({ polls } satisfies ListMyPollsResponse, { headers });
        } catch (err) {
          return toErrorResponse(err);
        }
      },
      POST: async ({ request }) => {
        try {
          const { identity, setCookie } = await ensureIdentity(request);
          const body = await readJson(request);
          const result = await createPoll(body, requestOrigin(request), identity.sub);

          const headers = new Headers();
          if (setCookie) headers.append("set-cookie", setCookie);
          return json(result, { status: 201, headers });
        } catch (err) {
          return toErrorResponse(err);
        }
      },
    },
  },
});
