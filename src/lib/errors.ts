/** Typed HTTP errors that the API layer maps to JSON responses. */

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "HttpError";
  }
}

export const badRequest = (code = "bad_request", message?: string) =>
  new HttpError(400, code, message);
export const notFound = (code = "not_found", message?: string) =>
  new HttpError(404, code, message);
export const forbidden = (code = "forbidden", message?: string) =>
  new HttpError(403, code, message);
export const conflict = (code = "conflict", message?: string) =>
  new HttpError(409, code, message);

/** Turn any thrown value into a JSON Response. */
export function toErrorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return Response.json(
      { error: err.code, message: err.message },
      { status: err.status },
    );
  }
  console.error("Unhandled API error:", err);
  return Response.json({ error: "internal_error" }, { status: 500 });
}
