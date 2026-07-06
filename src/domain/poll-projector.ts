import type { Poll, PollOption } from "#/db/schema";
import type { PollSummary, PollView } from "#/lib/poll/contracts";

/** Everything the projector needs to build a PollView. */
export interface ProjectionInput {
  poll: Poll;
  options: PollOption[];
  /** optionId -> vote count. */
  counts: Map<string, number>;
  /** The option this viewer voted for, or null if they haven't voted. */
  viewerOptionId: string | null;
  /** Whether the viewer holds a valid management key. */
  canManage: boolean;
  /** Evaluation time (injectable for testing). */
  now?: Date;
}

/**
 * Constructs the single API projection (PollView) from persisted facts plus
 * viewer context. This is where result-visibility is enforced: counts are
 * revealed only once the viewer has voted OR the poll has expired. Nothing
 * here is persisted.
 */
export function projectPollView(input: ProjectionInput): PollView {
  const { poll, options, counts, viewerOptionId, canManage } = input;
  const now = input.now ?? new Date();

  const isExpired = poll.expiresAt.getTime() <= now.getTime();
  const hasVoted = viewerOptionId !== null;
  const resultsVisible = hasVoted || isExpired;

  const totalVotes = [...counts.values()].reduce((a, b) => a + b, 0);

  const optionViews = options.map((opt) => {
    const voteCount = counts.get(opt.id) ?? 0;
    return {
      id: opt.id,
      text: opt.text,
      imageUrl: opt.imageUrl,
      voteCount: resultsVisible ? voteCount : null,
      percentage: resultsVisible ? percentage(voteCount, totalVotes) : null,
      selected: opt.id === viewerOptionId,
    };
  });

  return {
    id: poll.publicId,
    title: poll.title,
    description: poll.description,
    expiresAt: poll.expiresAt.toISOString(),
    isExpired,
    totalVotes: resultsVisible ? totalVotes : null,
    options: optionViews,
    viewer: {
      hasVoted,
      selectedOptionId: viewerOptionId,
      canManage,
    },
  };
}

/** Everything the projector needs to build a PollSummary. */
export interface SummaryProjectionInput {
  poll: Poll;
  optionCount: number;
  totalVotes: number;
  /** Whether this viewer has voted on the poll. */
  hasVoted: boolean;
  /** Evaluation time (injectable for testing). */
  now?: Date;
}

/**
 * Projects the list-item shape for the creator's "your polls" page. Enforces
 * the same visibility rule as `projectPollView`: the vote total is revealed
 * only once the viewer has voted OR the poll has expired.
 */
export function projectPollSummary(input: SummaryProjectionInput): PollSummary {
  const { poll, optionCount, totalVotes, hasVoted } = input;
  const now = input.now ?? new Date();

  const isExpired = poll.expiresAt.getTime() <= now.getTime();
  const resultsVisible = hasVoted || isExpired;

  return {
    id: poll.publicId,
    title: poll.title,
    description: poll.description,
    createdAt: poll.createdAt.toISOString(),
    expiresAt: poll.expiresAt.toISOString(),
    isExpired,
    optionCount,
    totalVotes: resultsVisible ? totalVotes : null,
    hasVoted,
  };
}

/** Whole-number percentage; 0 when there are no votes. */
function percentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}
