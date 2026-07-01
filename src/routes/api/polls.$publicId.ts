import { createFileRoute } from "@tanstack/react-router";

import { ensureIdentity } from "#/lib/auth/identity";
import { deletePoll, getPollView, updatePoll } from "#/domain/poll-service";
import { toErrorResponse } from "#/lib/errors";
import { json, readJson } from "#/lib/http";
import { MANAGEMENT_KEY_HEADER } from "#/lib/poll/contracts";

/** Build a JSON Response, attaching the freshly minted identity cookie if any. */
function jsonWithIdentity(
  data: unknown,
  setCookie: string | null,
  init?: ResponseInit,
): Response {
  const headers = new Headers(init?.headers);
  if (setCookie) headers.append("set-cookie", setCookie);
  return json(data, { ...init, headers });
}

/**
 * /api/polls/{publicId} — read, update, and (soft) delete a Poll.
 * All handlers return a PollView (the single API contract).
 */
export const Route = createFileRoute("/api/polls/$publicId")({
  server: {
    handlers: {
      /**
       * GET — fetch the PollView. Owns result-visibility (revealed once the
       * viewer has voted OR the poll expired). No separate /results endpoint.
       */
      GET: async ({ request, params }) => {
        try {
          const { identity, setCookie } = await ensureIdentity(request);
          const view = await getPollView({
            publicId: params.publicId,
            identitySub: identity.sub,
            managementKey: request.headers.get(MANAGEMENT_KEY_HEADER),
          });
          return jsonWithIdentity(view, setCookie);
        } catch (err) {
          return toErrorResponse(err);
        }
      },

      /**
       * PATCH — update title / description / expiresAt (options are immutable;
       * expiration may be extended even after expiry). Requires management key.
       */
      PATCH: async ({ request, params }) => {
        try {
          const { identity, setCookie } = await ensureIdentity(request);
          const view = await updatePoll({
            publicId: params.publicId,
            identitySub: identity.sub,
            managementKey: request.headers.get(MANAGEMENT_KEY_HEADER),
            rawInput: await readJson(request),
          });
          return jsonWithIdentity(view, setCookie);
        } catch (err) {
          return toErrorResponse(err);
        }
      },

      /** DELETE — soft delete (set deletedAt). Requires manager rights. */
      DELETE: async ({ request, params }) => {
        try {
          const { identity, setCookie } = await ensureIdentity(request);
          await deletePoll({
            publicId: params.publicId,
            identitySub: identity.sub,
            managementKey: request.headers.get(MANAGEMENT_KEY_HEADER),
          });
          const headers = new Headers();
          if (setCookie) headers.append("set-cookie", setCookie);
          return new Response(null, { status: 204, headers });
        } catch (err) {
          return toErrorResponse(err);
        }
      },
    },
  },
});
