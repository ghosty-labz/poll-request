import { useCallback, useEffect, useRef, useState } from "react";
import type { PollView } from "#/lib/poll/contracts";
import * as api from "./api";

const REOPEN_DURATION_MS = 36 * 60 * 60 * 1000; // mirrors the backend default

type Status = "loading" | "ready" | "error" | "deleted";

export interface UsePoll {
  view: PollView | null;
  status: Status;
  error: string | null;
  busy: boolean;
  vote: (optionId: string) => void;
  closeVoting: () => void;
  reopenVoting: () => void;
  remove: () => Promise<boolean>;
}

/**
 * Loads a poll, exposes voter + manager actions, and keeps results live via the
 * SSE stream once they're visible to this browser. `canManage` is pinned to the
 * authoritative keyed load — the (header-less) EventSource can't carry the key.
 */
export function usePoll(publicId: string, key: string | null): UsePoll {
  const [view, setView] = useState<PollView | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const canManageRef = useRef(false);

  const adopt = useCallback((next: PollView) => {
    canManageRef.current = next.viewer.canManage;
    setView(next);
    setStatus("ready");
    if (next.viewer.hasVoted || next.isExpired) setLive(true);
  }, []);

  // Initial load.
  useEffect(() => {
    let alive = true;
    setStatus("loading");
    api
      .fetchPoll(publicId, key)
      .then((v) => alive && adopt(v))
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Could not load this poll.");
        setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, [publicId, key, adopt]);

  // Live updates once results are visible to this browser's cookie.
  useEffect(() => {
    if (!live) return;
    const source = new EventSource(`/api/polls/${publicId}/events`);
    source.addEventListener("poll", (e) => {
      try {
        const next = JSON.parse((e as MessageEvent).data) as PollView;
        // Preserve manager mode — the stream can't see our management key.
        next.viewer.canManage = canManageRef.current;
        setView(next);
      } catch {
        /* ignore malformed frame */
      }
    });
    source.addEventListener("error", () => source.close());
    return () => source.close();
  }, [publicId, live]);

  const run = useCallback(
    async (action: () => Promise<PollView>) => {
      setBusy(true);
      setError(null);
      try {
        adopt(await action());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setBusy(false);
      }
    },
    [adopt],
  );

  const vote = useCallback(
    (optionId: string) => {
      if (busy) return;
      void run(() => api.castVote(publicId, optionId));
    },
    [busy, run, publicId],
  );

  const closeVoting = useCallback(
    () => void run(() => api.setExpiry(publicId, key, new Date(Date.now() - 1000))),
    [run, publicId, key],
  );

  const reopenVoting = useCallback(
    () => void run(() => api.setExpiry(publicId, key, new Date(Date.now() + REOPEN_DURATION_MS))),
    [run, publicId, key],
  );

  const remove = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await api.deletePoll(publicId, key);
      setStatus("deleted");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the poll.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [publicId, key]);

  return { view, status, error, busy, vote, closeVoting, reopenVoting, remove };
}
