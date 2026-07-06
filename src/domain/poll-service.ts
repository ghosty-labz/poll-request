import { getDb } from "#/db/index";
import {
  countOptionsByPoll,
  countVotesByOption,
  countVotesByPoll,
  findOptionsByPollId,
  findPollByPublicId,
  findPollsByCreatorId,
  findVote,
  findVotedPollIds,
  insertPollWithOptions,
  softDeletePoll,
  updatePollFields,
  upsertVote,
} from "#/db/repositories/poll-repository";
import type { NewPoll, NewPollOption, Poll, PollOption } from "#/db/schema";
import { notifyPollChanged, schedulePollClose } from "#/durable-objects/poll-room";
import { badRequest, conflict, forbidden, notFound } from "#/lib/errors";
import { newId, newToken } from "#/lib/ids";
import {
  POLL_DURATION_HOURS,
  type CreatePollResponse,
  type PollDurationHours,
  type PollSummary,
  type PollView,
} from "#/lib/poll/contracts";
import { projectPollSummary, projectPollView } from "./poll-projector";

const DEFAULT_DURATION_MS = 36 * 60 * 60 * 1000; // 36 hours
const MAX_OPTIONS = 20;

/** Create a poll and all its options atomically. Returns the share/manage URLs. */
export async function createPoll(
  rawInput: unknown,
  origin: string,
  creatorId: string,
): Promise<CreatePollResponse> {
  const input = parseCreatePollInput(rawInput);
  const db = getDb();

  const id = newId();
  const publicId = newToken();
  const managementKey = newToken();

  const pollRow: NewPoll = {
    id,
    publicId,
    managementKey,
    creatorId,
    title: input.title,
    description: input.description ?? null,
    expiresAt: input.expiresAt,
  };
  const optionRows: NewPollOption[] = input.options.map((opt, i) => ({
    pollId: id,
    text: opt.text,
    imageUrl: opt.imageUrl ?? null,
    displayOrder: i,
  }));

  await insertPollWithOptions(db, pollRow, optionRows);

  // Arm the poll's close alarm: its PollRoom pushes the final snapshot at expiry.
  await schedulePollClose(publicId, input.expiresAt);

  // Creator sees results immediately and can manage.
  const poll = await requirePoll(publicId);
  const options = await findOptionsByPollId(db, poll.id);
  const view = projectPollView({
    poll,
    options,
    counts: new Map(),
    viewerOptionId: null,
    canManage: true,
  });

  return {
    poll: view,
    shareUrl: `${origin}/polls/${publicId}`,
    manageUrl: `${origin}/polls/${publicId}?key=${managementKey}`,
  };
}

/**
 * List the live polls created by this identity, newest first. Only the cookie
 * identity can list — there is no management-key path here, since keys are
 * per-poll and this endpoint spans all of a browser's polls.
 */
export async function listMyPolls(identitySub: string): Promise<PollSummary[]> {
  const db = getDb();
  const myPolls = await findPollsByCreatorId(db, identitySub);
  if (myPolls.length === 0) return [];

  const pollIds = myPolls.map((p) => p.id);
  const [voteTotals, optionTotals, votedPollIds] = await Promise.all([
    countVotesByPoll(db, pollIds),
    countOptionsByPoll(db, pollIds),
    findVotedPollIds(db, pollIds, identitySub),
  ]);

  return myPolls.map((poll) =>
    projectPollSummary({
      poll,
      optionCount: optionTotals.get(poll.id) ?? 0,
      totalVotes: voteTotals.get(poll.id) ?? 0,
      hasVoted: votedPollIds.has(poll.id),
    }),
  );
}

/** Build the PollView for a viewer. Decides result visibility internally. */
export async function getPollView(args: {
  publicId: string;
  identitySub: string | null;
  managementKey: string | null;
}): Promise<PollView> {
  const poll = await requirePoll(args.publicId);
  return loadView(poll, args.identitySub, args.managementKey);
}

/**
 * Cast or change the browser's vote, then return the PollView (results now
 * visible to this viewer). The voter is identified by their JWT identity
 * (`identitySub`), which the route resolves from the cookie.
 */
export async function castVote(args: {
  publicId: string;
  rawInput: unknown;
  identitySub: string;
}): Promise<PollView> {
  const db = getDb();
  const optionId = parseVoteInput(args.rawInput);
  const poll = await requirePoll(args.publicId);

  if (poll.expiresAt.getTime() <= Date.now()) {
    throw conflict("poll_expired", "This poll has expired and is no longer accepting votes.");
  }

  const options = await findOptionsByPollId(db, poll.id);
  if (!options.some((o) => o.id === optionId)) {
    throw badRequest("invalid_option", "The selected option does not belong to this poll.");
  }

  await upsertVote(db, { pollId: poll.id, optionId, voterToken: args.identitySub });
  await notifyPollChanged(poll.publicId);

  return loadView(poll, args.identitySub, null, options);
}

/** Update a poll's mutable fields. Requires manager rights (identity or key). */
export async function updatePoll(args: {
  publicId: string;
  identitySub: string | null;
  managementKey: string | null;
  rawInput: unknown;
}): Promise<PollView> {
  const db = getDb();
  const poll = await requirePoll(args.publicId);
  assertCanManage(poll, args.identitySub, args.managementKey);

  const patch = parseUpdatePollInput(args.rawInput);
  if (Object.keys(patch).length > 0) {
    await updatePollFields(db, poll.id, patch);
    if (patch.expiresAt) await schedulePollClose(poll.publicId, patch.expiresAt);
    await notifyPollChanged(poll.publicId);
  }

  const updated = await requirePoll(args.publicId);
  return loadView(updated, args.identitySub, args.managementKey);
}

/** Soft-delete a poll. Requires manager rights (identity or key). */
export async function deletePoll(args: {
  publicId: string;
  identitySub: string | null;
  managementKey: string | null;
}): Promise<void> {
  const db = getDb();
  const poll = await requirePoll(args.publicId);
  assertCanManage(poll, args.identitySub, args.managementKey);
  await softDeletePoll(db, poll.id);
  await schedulePollClose(poll.publicId, null);
  await notifyPollChanged(poll.publicId);
}

// --- internals ---------------------------------------------------------------

async function requirePoll(publicId: string): Promise<Poll> {
  const poll = await findPollByPublicId(getDb(), publicId);
  if (!poll) throw notFound("poll_not_found", "Poll not found.");
  return poll;
}

/**
 * Whether a viewer may manage this poll: either they hold the poll's identity
 * (their cookie's `sub` matches the recorded creator) or they present the
 * backup management key.
 */
function canManagePoll(
  poll: Poll,
  identitySub: string | null,
  managementKey: string | null,
): boolean {
  const ownsByIdentity = poll.creatorId !== null && poll.creatorId === identitySub;
  const ownsByKey = managementKey !== null && managementKey === poll.managementKey;
  return ownsByIdentity || ownsByKey;
}

function assertCanManage(
  poll: Poll,
  identitySub: string | null,
  managementKey: string | null,
): void {
  if (!canManagePoll(poll, identitySub, managementKey)) {
    throw forbidden("not_authorized", "You are not authorized to manage this poll.");
  }
}

/** Shared load → project path used by every read-returning action. */
async function loadView(
  poll: Poll,
  identitySub: string | null,
  managementKey: string | null,
  options?: PollOption[],
): Promise<PollView> {
  const db = getDb();
  const [opts, counts, vote] = await Promise.all([
    options ? Promise.resolve(options) : findOptionsByPollId(db, poll.id),
    countVotesByOption(db, poll.id),
    identitySub ? findVote(db, poll.id, identitySub) : Promise.resolve(undefined),
  ]);

  return projectPollView({
    poll,
    options: opts,
    counts,
    viewerOptionId: vote?.optionId ?? null,
    canManage: canManagePoll(poll, identitySub, managementKey),
  });
}

// --- input parsing / validation ----------------------------------------------

function parseCreatePollInput(raw: unknown): {
  title: string;
  description: string | null;
  expiresAt: Date;
  options: Array<{ text: string; imageUrl: string | null }>;
} {
  const body = asRecord(raw);

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) throw badRequest("title_required", "A poll title is required.");

  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;

  let expiresAt: Date;
  if (body.durationHours !== undefined && body.durationHours !== null) {
    if (!POLL_DURATION_HOURS.includes(body.durationHours as PollDurationHours)) {
      throw badRequest(
        "invalid_duration",
        `durationHours must be one of: ${POLL_DURATION_HOURS.join(", ")}.`,
      );
    }
    expiresAt = new Date(Date.now() + (body.durationHours as number) * 60 * 60 * 1000);
  } else if (body.expiresAt === undefined || body.expiresAt === null) {
    expiresAt = new Date(Date.now() + DEFAULT_DURATION_MS);
  } else if (typeof body.expiresAt === "string") {
    expiresAt = new Date(body.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      throw badRequest("invalid_expiration", "expiresAt must be a valid ISO date string.");
    }
  } else {
    throw badRequest("invalid_expiration", "expiresAt must be an ISO date string.");
  }

  if (!Array.isArray(body.options)) {
    throw badRequest("options_required", "A list of options is required.");
  }
  const options = (body.options as unknown[]).map((o) => {
    const opt = asRecord(o);
    const text = typeof opt.text === "string" ? opt.text.trim() : "";
    if (!text) throw badRequest("invalid_option_text", "Every option needs non-empty text.");
    const imageUrl =
      typeof opt.imageUrl === "string" && opt.imageUrl.trim() ? opt.imageUrl.trim() : null;
    return { text, imageUrl };
  });
  if (options.length < 2) {
    throw badRequest("too_few_options", "A poll needs at least two options.");
  }
  if (options.length > MAX_OPTIONS) {
    throw badRequest("too_many_options", `A poll can have at most ${MAX_OPTIONS} options.`);
  }

  return { title, description, expiresAt, options };
}

function parseVoteInput(raw: unknown): string {
  const body = asRecord(raw);
  const optionId = typeof body.optionId === "string" ? body.optionId : "";
  if (!optionId) throw badRequest("option_required", "An optionId is required to vote.");
  return optionId;
}

function parseUpdatePollInput(
  raw: unknown,
): Partial<Pick<Poll, "title" | "description" | "expiresAt">> {
  const body = asRecord(raw);
  const patch: Partial<Pick<Poll, "title" | "description" | "expiresAt">> = {};

  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) throw badRequest("title_required", "Title cannot be empty.");
    patch.title = title;
  }
  if (body.description !== undefined) {
    patch.description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
  }
  if (body.expiresAt !== undefined) {
    if (typeof body.expiresAt !== "string") {
      throw badRequest("invalid_expiration", "expiresAt must be an ISO date string.");
    }
    const date = new Date(body.expiresAt);
    if (Number.isNaN(date.getTime())) {
      throw badRequest("invalid_expiration", "expiresAt must be a valid ISO date string.");
    }
    patch.expiresAt = date;
  }

  return patch;
}

function asRecord(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "object" || raw === null) {
    throw badRequest("invalid_body", "Request body must be a JSON object.");
  }
  return raw as Record<string, unknown>;
}
