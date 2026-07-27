import { useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { SoundToggle } from "#/components/SoundToggle";
import { ManagerBar } from "./ManagerBar";
import { OptionRow } from "./OptionRow";
import { PollNotFound } from "./PollNotFound";
import { ShareStrip } from "./ShareStrip";
import { StatusPill } from "./StatusPill";
import { usePoll } from "./usePoll";

interface PollViewProps {
  publicId: string;
  /** Management key from the URL; unlocks manager controls when valid. */
  managementKey: string | null;
}

export function PollView({ publicId, managementKey }: PollViewProps) {
  const navigate = useNavigate();
  const { view, status, error, busy, vote, closeVoting, reopenVoting, remove } = usePoll(
    publicId,
    managementKey,
  );

  const shareUrl = useMemo(
    () => (typeof window !== "undefined" ? `${window.location.origin}/polls/${publicId}` : ""),
    [publicId],
  );

  const leader = useMemo(() => {
    if (!view || view.totalVotes === null) return null;
    const top = [...view.options].sort(
      (a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0),
    )[0];
    return top ? { label: top.text, pct: top.percentage ?? 0 } : null;
  }, [view]);

  // A missing/deleted poll (dead share link) gets the full 404 screen.
  if (status === "error" || status === "deleted") return <PollNotFound />;

  return (
    <div className="min-h-screen bg-cream font-plex text-ink">
      <div className="mx-auto max-w-[760px]">
        <Nav />
        <div className="px-7 pb-[70px] pt-[42px]">
          {status === "loading" && <Centered>loading poll…</Centered>}

          {status === "ready" && view && (
            <>
              {view.viewer.canManage && (
                <ManagerBar
                  expired={view.isExpired}
                  busy={busy}
                  shareUrl={shareUrl}
                  leader={leader}
                  onToggleStatus={view.isExpired ? reopenVoting : closeVoting}
                  onDelete={async () => {
                    if (!window.confirm("Delete this Poll Request? This cannot be undone.")) return;
                    if (await remove()) navigate({ to: "/" });
                  }}
                />
              )}

              <PollCard
                view={view}
                onVote={vote}
              />

              <ShareStrip url={shareUrl} />

              <div className="mt-6 text-center font-plex text-[11px] font-semibold text-[#9aa091]">
                merge opinions, not conflicts · poll_request
              </div>

              {error && (
                <div className="mt-4 rounded-lg border-2 border-[#ff4d5e] bg-[#ffecee] px-4 py-3 font-plex text-[13px] font-semibold text-[#9f3030]">
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PollCard({
  view,
  onVote,
}: {
  view: NonNullable<ReturnType<typeof usePoll>["view"]>;
  onVote: (optionId: string) => void;
}) {
  const showResults = view.totalVotes !== null;
  const votable = !view.isExpired;
  const subline =
    view.description ??
    (view.isExpired
      ? "voting closed · here are the results"
      : "pick one · results show after you vote");

  return (
    <div className="rounded-[14px] border-2 border-ink bg-white px-[30px] pb-[26px] pt-[30px] shadow-[7px_7px_0_var(--color-ink)]">
      <div className="mb-[18px] flex items-center justify-between gap-3">
        <div className="flex items-center gap-[9px]">
          <StatusPill expired={view.isExpired} />
          <span className="font-plex text-[11px] font-semibold text-[#9aa091]">single choice</span>
        </div>
      </div>

      <div className="mb-[6px] font-plex text-2xl font-bold leading-[1.4] text-ink">
        {view.title}
      </div>
      <div className="mb-6 font-plex text-[13px] text-[#9aa091]">// {subline}</div>

      <div className="flex flex-col gap-3">
        {view.options.map((opt) => (
          <OptionRow
            key={opt.id}
            option={opt}
            showResults={showResults}
            votable={votable}
            onVote={onVote}
          />
        ))}
      </div>

      <div className="mt-[22px] flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e4d6] pt-[18px]">
        <span className="font-plex text-xs font-semibold text-[#5c6356]">
          {showResults ? `${view.totalVotes} votes cast` : "results hidden until you vote"}
        </span>
        <span className="font-plex text-xs font-semibold text-[#9aa091]">
          {view.isExpired
            ? "voting is closed"
            : view.viewer.hasVoted
              ? "thanks for voting"
              : "anonymous · tap to vote"}
        </span>
      </div>
    </div>
  );
}

function Nav() {
  return (
    <div className="flex items-center justify-between border-b-2 border-ink px-7 py-[22px]">
      <Link to="/" className="flex items-center gap-[11px] no-underline">
        <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md bg-ink font-pixel text-[11px] text-neon">
          PR
        </span>
        <span className="font-plex text-[15px] font-bold text-ink">poll_request</span>
      </Link>
      <SoundToggle />
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center font-plex text-sm font-semibold text-[#9aa091]">
      {children}
    </div>
  );
}
