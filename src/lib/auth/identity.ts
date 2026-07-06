/**
 * Anonymous browser identity, carried as a signed JWT in an HttpOnly cookie.
 *
 * Every visitor gets one identity (`sub`) the first time they touch an API that
 * needs it. That single identity does double duty:
 *   - voting: a vote row is keyed by `sub`, so we know if *this* identity voted;
 *   - management: a poll records its creator's `sub`, so the creator is
 *     recognised by their cookie (the per-poll management key remains a backup).
 *
 * The token is HttpOnly so the browser — not client JS — owns identity, exactly
 * like the voter cookie it replaces.
 */

import { env } from "cloudflare:workers";
import { newToken } from "#/lib/ids";
import { type JwtClaims, signJwt, verifyJwt } from "./jwt";

export const IDENTITY_COOKIE = "pr_identity";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Sliding refresh: once a token has less than this long left, `ensureIdentity`
 * re-mints it (same `sub`) so active browsers keep their identity indefinitely
 * instead of silently losing poll ownership after a fixed year.
 */
const REFRESH_THRESHOLD_SECONDS = ONE_YEAR_SECONDS / 2;

/** A resolved browser identity. */
export interface Identity {
  /** The anonymous subject id — stable for the life of the cookie. */
  sub: string;
}

/**
 * Dev fallback secret. Production must set a real `JWT_SECRET`
 * (`wrangler secret put JWT_SECRET`); tokens signed with this fallback are only
 * valid against itself, so a configured prod secret invalidates them.
 */
const DEV_SECRET = "dev-insecure-poll-request-identity-secret";

function getJwtSecret(): string {
  const secret = (env as { JWT_SECRET?: string }).JWT_SECRET;
  return secret && secret.length > 0 ? secret : DEV_SECRET;
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** Build the Set-Cookie value carrying a freshly minted identity token. */
function buildIdentityCookie(token: string, secure: boolean): string {
  const attrs = [
    `${IDENTITY_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${ONE_YEAR_SECONDS}`,
  ];
  if (secure) attrs.push("Secure");
  return attrs.join("; ");
}

async function mintToken(sub: string): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const claims: JwtClaims = { sub, iat: nowSeconds, exp: nowSeconds + ONE_YEAR_SECONDS };
  return signJwt(claims, getJwtSecret());
}

async function readVerifiedClaims(request: Request): Promise<JwtClaims | null> {
  const token = readCookie(request, IDENTITY_COOKIE);
  if (!token) return null;
  return verifyJwt(token, getJwtSecret());
}

/**
 * Read and verify the identity from the request cookie, or null when absent or
 * invalid. Use this for read-only paths (e.g. the SSE stream) that can't set a
 * cookie on the response.
 */
export async function readIdentity(request: Request): Promise<Identity | null> {
  const claims = await readVerifiedClaims(request);
  return claims ? { sub: claims.sub } : null;
}

/**
 * Resolve the request's identity, minting and returning a fresh one when the
 * cookie is missing or invalid, or re-minting (same `sub`) when the existing
 * token is past the sliding-refresh threshold. When `setCookie` is non-null
 * the caller MUST append it to the response so the browser keeps the identity.
 */
export async function ensureIdentity(
  request: Request,
): Promise<{ identity: Identity; setCookie: string | null }> {
  const secure = new URL(request.url).protocol === "https:";
  const claims = await readVerifiedClaims(request);

  if (claims) {
    const secondsLeft = (claims.exp ?? 0) - Math.floor(Date.now() / 1000);
    if (secondsLeft > REFRESH_THRESHOLD_SECONDS) {
      return { identity: { sub: claims.sub }, setCookie: null };
    }
    const token = await mintToken(claims.sub);
    return { identity: { sub: claims.sub }, setCookie: buildIdentityCookie(token, secure) };
  }

  const sub = newToken();
  const token = await mintToken(sub);
  return { identity: { sub }, setCookie: buildIdentityCookie(token, secure) };
}
