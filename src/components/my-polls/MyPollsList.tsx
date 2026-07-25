import { Link } from "@tanstack/react-router";
import type { PollSummary } from "#/lib/poll/contracts";
import { StatusPill } from "#/components/poll-view/StatusPill";

/**
 * The creator's poll list, as loaded by the `/polls` route loader. Identity is
 * the HttpOnly cookie, so this can only ever show polls made from this browser
 * — polls created elsewhere (or after the cookie was cleared) won't appear;
 * their manage links still work.
 */
export function MyPollsList({ polls }: { polls: PollSummary[] }) {
  if (polls.length === 0) {
    return (
      <div className="rounded-[14px] border-2 border-dashed border-[#c9c8b8] px-8 py-14 text-center">
        <div className="font-plex text-[15px] font-bold text-ink">No polls from this browser yet.</div>
        <p className="mx-auto mt-3 max-w-105 font-plex text-[13px] leading-[1.7] text-[#54594c]">
          Polls you create here will show up in this list automatically — no
          account needed, your browser is the key.
        </p>
        <Link
          to="/polls/new"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 font-plex text-[13px] font-bold text-neon no-underline shadow-[3px_3px_0_var(--color-neon)]"
        >
          Open a Poll Request →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {polls.map((poll) => (
        <PollRow key={poll.id} poll={poll} />
      ))}
    </div>
  );
}

function PollRow({ poll }: { poll: PollSummary }) {
  return (
    <Link
      to="/polls/$publicId"
      params={{ publicId: poll.id }}
      className="block rounded-xl border-2 border-ink bg-white px-6 py-5 no-underline shadow-[4px_4px_0_var(--color-ink)] transition-transform hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_var(--color-neon)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-plex text-[16px] font-bold text-ink">{poll.title}</div>
          {poll.description && (
            <div className="mt-1 truncate font-plex text-[12px] text-[#9aa091]">
              // {poll.description}
            </div>
          )}
        </div>
        <StatusPill expired={poll.isExpired} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 font-plex text-[12px] font-semibold text-[#5c6356]">
        <span>
          {poll.totalVotes !== null
            ? `${poll.totalVotes} vote${poll.totalVotes === 1 ? "" : "s"}`
            : "results hidden until you vote"}
        </span>
        <span>{poll.optionCount} options</span>
        <span>created {shortDate(poll.createdAt)}</span>
        <span>{poll.isExpired ? `closed ${shortDate(poll.expiresAt)}` : `closes ${shortDate(poll.expiresAt)}`}</span>
      </div>
    </Link>
  );
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
