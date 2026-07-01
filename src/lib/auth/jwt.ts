/**
 * Minimal HS256 (HMAC-SHA-256) JWT sign/verify built on WebCrypto.
 *
 * No dependencies — Cloudflare Workers ships `crypto.subtle`, `btoa`/`atob`.
 * Only the one algorithm we use is supported; the header `alg` is checked on
 * verify so a token can't downgrade itself. Tokens are signed with a shared
 * secret (see `getJwtSecret`).
 */

const ALG = "HS256";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface JwtClaims {
  /** Subject — the anonymous identity this token represents. */
  sub: string;
  /** Issued-at, seconds since epoch. */
  iat?: number;
  /** Expiry, seconds since epoch. Verified when present. */
  exp?: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const bin = atob(value.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Copy into a standalone ArrayBuffer — a BufferSource WebCrypto accepts. */
function buf(view: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(view.byteLength);
  new Uint8Array(out).set(view);
  return out;
}

function utf8(value: string): ArrayBuffer {
  return buf(encoder.encode(value));
}

function encodeJson(value: unknown): string {
  return base64UrlEncode(encoder.encode(JSON.stringify(value)));
}

function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    utf8(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Sign a set of claims into a compact JWS. */
export async function signJwt(claims: JwtClaims, secret: string): Promise<string> {
  const signingInput = `${encodeJson({ alg: ALG, typ: "JWT" })}.${encodeJson(claims)}`;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, utf8(signingInput));
  return `${signingInput}.${base64UrlEncode(new Uint8Array(sig))}`;
}

/**
 * Verify a token's signature and (if present) expiry. Returns the claims, or
 * null for anything malformed, mis-signed, wrong-alg, or expired — callers
 * treat null as "no identity".
 */
export async function verifyJwt(token: string, secret: string): Promise<JwtClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;

  try {
    const header = JSON.parse(decoder.decode(base64UrlDecode(headerB64))) as { alg?: string };
    if (header.alg !== ALG) return null;

    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      buf(base64UrlDecode(sigB64)),
      utf8(`${headerB64}.${payloadB64}`),
    );
    if (!valid) return null;

    const claims = JSON.parse(decoder.decode(base64UrlDecode(payloadB64))) as JwtClaims;
    if (typeof claims.sub !== "string" || !claims.sub) return null;
    if (typeof claims.exp === "number" && claims.exp * 1000 <= Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}
