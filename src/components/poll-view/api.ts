/** Thin client for the poll endpoints, returning typed PollViews. */

import { MANAGEMENT_KEY_HEADER, type PollView } from "#/lib/poll/contracts";

class PollApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "PollApiError";
  }
}

function keyHeaders(key: string | null): HeadersInit {
  return key ? { [MANAGEMENT_KEY_HEADER]: key } : {};
}

async function asView(res: Response): Promise<PollView> {
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null;
    throw new PollApiError(
      data?.error ?? `http_${res.status}`,
      data?.message ?? `Request failed (${res.status})`,
    );
  }
  return (await res.json()) as PollView;
}

export function fetchPoll(publicId: string, key: string | null): Promise<PollView> {
  return fetch(`/api/polls/${publicId}`, { headers: keyHeaders(key) }).then(asView);
}

export function castVote(publicId: string, optionId: string): Promise<PollView> {
  return fetch(`/api/polls/${publicId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ optionId }),
  }).then(asView);
}

/** Close (expiresAt in the past) or reopen (extend) a poll. Manager only. */
export function setExpiry(
  publicId: string,
  key: string | null,
  expiresAt: Date,
): Promise<PollView> {
  return fetch(`/api/polls/${publicId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...keyHeaders(key) },
    body: JSON.stringify({ expiresAt: expiresAt.toISOString() }),
  }).then(asView);
}

export async function deletePoll(publicId: string, key: string | null): Promise<void> {
  const res = await fetch(`/api/polls/${publicId}`, {
    method: "DELETE",
    headers: keyHeaders(key),
  });
  if (!res.ok && res.status !== 204) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new PollApiError("delete_failed", data?.message ?? "Could not delete the poll.");
  }
}

export { PollApiError };
