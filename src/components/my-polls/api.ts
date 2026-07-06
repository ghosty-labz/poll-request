/** Thin client for the "your polls" listing endpoint. */

import type { ListMyPollsResponse, PollSummary } from "#/lib/poll/contracts";

export async function fetchMyPolls(): Promise<PollSummary[]> {
  const res = await fetch("/api/polls");
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? `Request failed (${res.status})`);
  }
  const body = (await res.json()) as ListMyPollsResponse;
  return body.polls;
}
