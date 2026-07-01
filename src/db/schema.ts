import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { newId, newToken } from "#/lib/ids";

/**
 * Drizzle schema for the Poll aggregate.
 *
 * Poll is the aggregate root; PollOption and Vote are owned by it. We persist
 * facts only — no status column (state is derived from expiresAt/deletedAt) and
 * no vote counters (totals are computed from Vote rows). See the RFC.
 *
 * Timestamps are stored as epoch milliseconds (`timestamp_ms`) and surface as
 * `Date` objects in TypeScript.
 */

export const polls = sqliteTable("polls", {
  /** Internal primary key. Never exposed by the API. */
  id: text("id").primaryKey().$defaultFn(newId),

  /** Public, shareable identifier used in URLs and as the API path param. */
  publicId: text("public_id").notNull().$defaultFn(newToken).unique(),

  /** Secret key required (via X-Poll-Management-Key) to manage the poll. */
  managementKey: text("management_key").notNull().$defaultFn(newToken),

  /**
   * The creator's anonymous identity (JWT `sub`). The creator is recognised as
   * manager when their identity cookie matches this, with the management key as
   * a backup path. Nullable: polls created before identity-based ownership have
   * none and are managed by key only.
   */
  creatorId: text("creator_id"),

  title: text("title").notNull(),
  description: text("description"),

  /** When the poll stops accepting votes. Creators may extend this. */
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),

  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
  /** Soft-delete marker. Null = live; non-null = excluded from normal queries. */
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
});

export const pollOptions = sqliteTable("poll_options", {
  id: text("id").primaryKey().$defaultFn(newId),

  pollId: text("poll_id")
    .notNull()
    .references(() => polls.id, { onDelete: "cascade" }),

  text: text("text").notNull(),
  /** Designed now, not surfaced in the V1 UI. */
  imageUrl: text("image_url"),

  /** Stable ordering for display; immutable once voting begins. */
  displayOrder: integer("display_order").notNull(),

  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const votes = sqliteTable(
  "votes",
  {
    id: text("id").primaryKey().$defaultFn(newId),

    pollId: text("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    optionId: text("option_id")
      .notNull()
      .references(() => pollOptions.id, { onDelete: "cascade" }),

    /**
     * The voter's anonymous identity (JWT `sub`, from the HttpOnly identity
     * cookie). One vote per identity per poll.
     */
    voterToken: text("voter_token").notNull(),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    // One vote per browser per poll; changing a vote updates this row.
    uniqueIndex("votes_poll_voter_unq").on(table.pollId, table.voterToken),
  ],
);

export type Poll = typeof polls.$inferSelect;
export type NewPoll = typeof polls.$inferInsert;
export type PollOption = typeof pollOptions.$inferSelect;
export type NewPollOption = typeof pollOptions.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
