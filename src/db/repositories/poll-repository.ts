import { and, asc, count, eq, isNull } from "drizzle-orm";

import type { Database } from "#/db/index";
import {
  pollOptions,
  polls,
  votes,
  type NewPoll,
  type NewPollOption,
  type Poll,
  type PollOption,
  type Vote,
} from "#/db/schema";

/**
 * Data access for the Poll aggregate. Loads and persists entities only — no
 * business rules or projection logic lives here.
 */

/** Insert a poll and its options atomically (D1 batch is transactional). */
export async function insertPollWithOptions(
  db: Database,
  poll: NewPoll,
  options: NewPollOption[],
): Promise<void> {
  await db.batch([
    db.insert(polls).values(poll),
    db.insert(pollOptions).values(options),
  ]);
}

/** Find a live (non-deleted) poll by its public id. */
export async function findPollByPublicId(
  db: Database,
  publicId: string,
): Promise<Poll | undefined> {
  const rows = await db
    .select()
    .from(polls)
    .where(and(eq(polls.publicId, publicId), isNull(polls.deletedAt)))
    .limit(1);
  return rows[0];
}

/** Options for a poll, in display order. */
export async function findOptionsByPollId(
  db: Database,
  pollId: string,
): Promise<PollOption[]> {
  return db
    .select()
    .from(pollOptions)
    .where(eq(pollOptions.pollId, pollId))
    .orderBy(asc(pollOptions.displayOrder));
}

/** The viewer's existing vote on a poll, if any. */
export async function findVote(
  db: Database,
  pollId: string,
  voterToken: string,
): Promise<Vote | undefined> {
  const rows = await db
    .select()
    .from(votes)
    .where(and(eq(votes.pollId, pollId), eq(votes.voterToken, voterToken)))
    .limit(1);
  return rows[0];
}

/** Vote counts per option for a poll, as a Map keyed by optionId. */
export async function countVotesByOption(
  db: Database,
  pollId: string,
): Promise<Map<string, number>> {
  const rows = await db
    .select({ optionId: votes.optionId, total: count() })
    .from(votes)
    .where(eq(votes.pollId, pollId))
    .groupBy(votes.optionId);
  return new Map(rows.map((r) => [r.optionId, r.total]));
}

/**
 * Create the browser's vote, or update it if one already exists
 * (UNIQUE(pollId, voterToken)). No vote history is kept in V1.
 */
export async function upsertVote(
  db: Database,
  vote: { pollId: string; optionId: string; voterToken: string },
): Promise<void> {
  await db
    .insert(votes)
    .values(vote)
    .onConflictDoUpdate({
      target: [votes.pollId, votes.voterToken],
      set: { optionId: vote.optionId, updatedAt: new Date() },
    });
}

/** Apply a partial update to a poll's mutable fields. */
export async function updatePollFields(
  db: Database,
  pollId: string,
  patch: Partial<Pick<Poll, "title" | "description" | "expiresAt">>,
): Promise<void> {
  await db.update(polls).set(patch).where(eq(polls.id, pollId));
}

/** Soft-delete a poll by setting deletedAt. */
export async function softDeletePoll(db: Database, pollId: string): Promise<void> {
  await db.update(polls).set({ deletedAt: new Date() }).where(eq(polls.id, pollId));
}
