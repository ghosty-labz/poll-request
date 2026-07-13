import { useCallback, useEffect, useRef, useState } from "react";
import type { PollView } from "#/lib/poll/contracts";
import * as api from "./api";

const REOPEN_DURATION_MS = 36 * 60 * 60 * 1000; // mirrors the backend default

export interface UsePoll {
  view: PollView;
  deleted: boolean;
  error: string | null;
  busy: boolean;
  vote: (optionId: string) => void;
  closeVoting: () => void;
  reopenVoting: () => void;
  remove: () => Promise<boolean>;
}

/**
 * Holds a poll's live state, seeded from the route loader's PollView (the
 * caller remounts this hook per poll/key, so `initialView` is stable for the
 * hook's lifetime). Exposes voter + manager actions and keeps results live via
 * the SSE stream once they're visible to this browser. `canManage` is pinned
 * to the authoritative keyed load — the (header-less) EventSource can't carry
 * the key.
 */
export function usePoll(publicId: string, key: string | null, initialView: PollView): UsePoll {
  const [view, setView] = useState(initialView);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(initialView.viewer.hasVoted || initialView.isExpired);
  const canManageRef = useRef(initialView.viewer.canManage);

  const adopt = useCallback((next: PollView) => {
    canManageRef.current = next.viewer.canManage;
    setView(next);
    if (next.viewer.hasVoted || next.isExpired) setLive(true);
  }, []);

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
      setDeleted(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the poll.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [publicId, key]);

  return { view, deleted, error, busy, vote, closeVoting, reopenVoting, remove };
}
