import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

/**
 * Drizzle database client bound to the Cloudflare D1 instance.
 *
 * The binding name (`dev_poll_request_db`) comes from wrangler.jsonc and is
 * typed via `cloudflare:workers`. Access the database inside server route
 * handlers with `getDb()`. Repositories build queries against the tables
 * imported directly from `./schema` (core query builder, not `db.query`).
 */
export type Database = ReturnType<typeof drizzle>;

let db: Database | undefined;

export function getDb(): Database {
  db ??= drizzle(env.dev_poll_request_db);
  return db;
}
