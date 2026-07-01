/**
 * API contracts for the Poll application.
 *
 * These are the *projection* shapes the frontend consumes — not the persisted
 * domain entities. See the RFC: `PollView` is the single API contract and is
 * constructed by the `PollProjector` from Poll + PollOption + Vote + viewer
 * context. Internal entities are never returned directly.
 *
 * Types only — no logic lives here.
 */

/** A single option as projected into a `PollView`. */
export interface PollOptionView {
  id: string;
  text: string;
  imageUrl: string | null;

  /**
   * Null until results are visible (viewer has voted OR poll has expired).
   * Visibility is decided by the backend, never the frontend.
   */
  voteCount: number | null;
  percentage: number | null;

  /** Whether this option is the viewer's current selection. */
  selected: boolean;
}

/** Viewer-specific context folded into the projection. */
export interface PollViewerContext {
  hasVoted: boolean;
  selectedOptionId: string | null;
  canManage: boolean;
}

/**
 * The one and only projection returned by the API. Never persisted.
 * `totalVotes` and per-option counts are null until results are visible.
 */
export interface PollView {
  id: string;

  title: string;
  description: string | null;

  expiresAt: string;
  isExpired: boolean;

  totalVotes: number | null;

  options: PollOptionView[];

  viewer: PollViewerContext;
}

/** Request body for `POST /api/polls`. */
export interface CreatePollRequest {
  title: string;
  description?: string | null;
  /** ISO timestamp. Defaults to now + 36h when omitted. */
  expiresAt?: string;
  options: Array<{ text: string; imageUrl?: string | null }>;
}

/** Response body for `POST /api/polls`. */
export interface CreatePollResponse {
  poll: PollView;
  shareUrl: string;
  manageUrl: string;
}

/** Request body for `PATCH /api/polls/{publicId}`. Options are immutable once voting begins. */
export interface UpdatePollRequest {
  title?: string;
  description?: string | null;
  /** ISO timestamp. May be extended even after expiry. */
  expiresAt?: string;
}

/** Request body for `POST /api/polls/{publicId}/vote`. */
export interface CastVoteRequest {
  optionId: string;
}

/** Header carrying the poll management key (returned only at creation). */
export const MANAGEMENT_KEY_HEADER = "X-Poll-Management-Key";
