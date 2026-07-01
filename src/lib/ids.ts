/** Identifier and token generation. */

/** Internal entity id (UUID v4). Never exposed by the API. */
export function newId(): string {
  return crypto.randomUUID();
}

/**
 * URL-safe, high-entropy token used for public ids and management keys.
 * 32 base32-ish chars (~160 bits). Avoids ambiguous characters.
 */
export function newToken(): string {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}
