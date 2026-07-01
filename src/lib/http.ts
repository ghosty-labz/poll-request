import { badRequest } from "./errors";

/** Minimal HTTP helpers shared by the API server routes. */

/** JSON response with the correct content-type. */
export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

/** Parse a request's JSON body, throwing a 400 HttpError on malformed JSON. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw badRequest("invalid_json", "Request body must be valid JSON.");
  }
}

/** The request's origin (scheme + host), used to build share/manage URLs. */
export function requestOrigin(request: Request): string {
  return new URL(request.url).origin;
}

/** Whether the request was served over HTTPS (controls the Secure cookie flag). */
export function isSecureRequest(request: Request): boolean {
  return new URL(request.url).protocol === "https:";
}
