import { createFileRoute } from "@tanstack/react-router";

import { ensureIdentity } from "#/lib/auth/identity";
import { createPoll } from "#/domain/poll-service";
import { toErrorResponse } from "#/lib/errors";
import { json, readJson, requestOrigin } from "#/lib/http";

/**
 * POST /api/polls — Create Poll (aggregate root action).
 *
 * Client submits the entire poll (title, optional description, expiration,
 * options) in one atomic request. Default expiration is now + 36h.
 *
 * Returns CreatePollResponse: { poll: PollView, shareUrl, manageUrl }.
 * The management key is returned here only (inside manageUrl).
 */
export const Route = createFileRoute("/api/polls")({
  server: {
    handlers: {
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
