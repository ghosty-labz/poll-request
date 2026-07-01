import { createFileRoute } from "@tanstack/react-router";

import { ensureIdentity } from "#/lib/auth/identity";
import { castVote } from "#/domain/poll-service";
import { toErrorResponse } from "#/lib/errors";
import { readJson } from "#/lib/http";

/**
 * POST /api/polls/{publicId}/vote — Cast Vote (aggregate root action).
 *
 * Anonymous: one vote per identity, identified by the HttpOnly JWT identity
 * cookie (minted on first contact). Creates the vote, or updates the existing
 * one. Returns the PollView — now with results visible to this viewer.
 */
export const Route = createFileRoute("/api/polls/$publicId/vote")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const { identity, setCookie } = await ensureIdentity(request);
          const view = await castVote({
            publicId: params.publicId,
            rawInput: await readJson(request),
            identitySub: identity.sub,
          });

          const headers = new Headers({ "content-type": "application/json" });
          if (setCookie) headers.append("set-cookie", setCookie);
          return new Response(JSON.stringify(view), { status: 200, headers });
        } catch (err) {
          return toErrorResponse(err);
        }
      },
    },
  },
});
