/**
 * Server functions backing the route loaders — the loader-side sibling of
 * `src/routes/api/*`. Same thin transport layer: resolve identity from the
 * request cookie, call into `domain/poll-service`, translate errors.
 *
 * Read-only by design: unlike the API routes these never mint an identity
 * cookie (loaders shouldn't have side effects). A first-time visitor simply
 * reads as anonymous; their identity is minted by the first mutating API call
 * (vote / create).
 */

import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { getPollView, listMyPolls } from "#/domain/poll-service";
import { readIdentity } from "#/lib/auth/identity";
import { HttpError } from "#/lib/errors";
import type { PollSummary, PollView } from "#/lib/poll/contracts";

/** Loader data for `/polls/$publicId` — a PollView projected for this viewer. */
export const fetchPollViewFn = createServerFn({ method: "GET" })
  .validator((data: { publicId: string; key: string | null }) => data)
  .handler(async ({ data }): Promise<PollView> => {
    const identity = await readIdentity(getRequest());
    try {
      return await getPollView({
        publicId: data.publicId,
        identitySub: identity?.sub ?? null,
        managementKey: data.key,
      });
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) throw notFound();
      throw err;
    }
  });

/** Loader data for `/polls` — polls created by this browser's identity. */
export const fetchMyPollsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<PollSummary[]> => {
    const identity = await readIdentity(getRequest());
    if (!identity) return [];
    return listMyPolls(identity.sub);
  },
);
