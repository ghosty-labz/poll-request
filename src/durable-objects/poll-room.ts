import { DurableObject, env } from "cloudflare:workers";

import { readIdentity } from "#/lib/auth/identity";
import { getPollView } from "#/domain/poll-service";
import { HttpError } from "#/lib/errors";
import { MANAGEMENT_KEY_HEADER } from "#/lib/poll/contracts";

/**
 * One PollRoom per poll (keyed by publicId via `getByName`). Holds the poll's
 * currently-open SSE connections in memory only — D1 stays the source of
 * truth, this just coordinates push-based fan-out instead of interval
 * polling. `notifyChange()` is called by poll-service after a mutation; each
 * open connection re-projects with its own identity so viewer-specific fields
 * (hasVoted/selectedOptionId) never leak across connections.
 */

const encoder = new TextEncoder();

interface Connection {
  controller: ReadableStreamDefaultController<Uint8Array>;
  identitySub: string | null;
  managementKey: string | null;
  lastPayload: string;
}

export class PollRoom extends DurableObject<Env> {
  private connections = new Map<string, Connection>();

  async fetch(request: Request): Promise<Response> {
    // Read-only: a stream can't reliably set a cookie, so we don't mint one
    // here (mirrors the identity handling the route used to do directly).
    const identity = await readIdentity(request);
    const managementKey = request.headers.get(MANAGEMENT_KEY_HEADER);
    const connId = crypto.randomUUID();

    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.connections.set(connId, {
          controller,
          identitySub: identity?.sub ?? null,
          managementKey,
          lastPayload: "",
        });
        request.signal.addEventListener("abort", () => this.closeConnection(connId));
        void this.refresh(connId); // immediate first snapshot
      },
      cancel: () => this.closeConnection(connId),
    });

    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
      },
    });
  }

  /** RPC: called by poll-service after a mutation. Re-projects for every open connection. */
  async notifyChange(): Promise<void> {
    await Promise.all([...this.connections.keys()].map((id) => this.refresh(id)));
  }

  /**
   * RPC: (re)arm the close alarm at the poll's expiry. `setAlarm` replaces any
   * existing alarm, so extending a poll just moves the trigger. Null (deleted
   * poll) or a past expiry (manual close, which already notified) cancels it.
   */
  async scheduleClose(expiresAtMs: number | null): Promise<void> {
    if (expiresAtMs === null || expiresAtMs <= Date.now()) {
      await this.ctx.storage.deleteAlarm();
      return;
    }
    await this.ctx.storage.setAlarm(expiresAtMs);
  }

  /**
   * Fires at expiry: pushes the closing snapshot (`isExpired: true`, results
   * now visible) to every open connection the moment the poll closes, instead
   * of waiting for the next vote to trigger a refresh.
   */
  async alarm(): Promise<void> {
    await this.notifyChange();
  }

  private async refresh(connId: string): Promise<void> {
    const conn = this.connections.get(connId);
    if (!conn) return;
    try {
      const view = await getPollView({
        publicId: this.ctx.id.name!,
        identitySub: conn.identitySub,
        managementKey: conn.managementKey,
      });
      const payload = JSON.stringify(view);
      if (payload !== conn.lastPayload) {
        conn.lastPayload = payload;
        this.send(conn, "poll", payload);
      }
    } catch (err) {
      const code = err instanceof HttpError ? err.code : "internal_error";
      this.send(conn, "error", JSON.stringify({ error: code }));
      this.closeConnection(connId);
    }
  }

  private send(conn: Connection, event: string, data: string): void {
    try {
      conn.controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
    } catch {
      /* controller already closed */
    }
  }

  private closeConnection(connId: string): void {
    const conn = this.connections.get(connId);
    if (!conn) return;
    this.connections.delete(connId);
    try {
      conn.controller.close();
    } catch {
      /* already closed */
    }
  }
}

/** Fire-and-forget: ping the poll's room so open viewers re-check. Never throws. */
export async function notifyPollChanged(publicId: string): Promise<void> {
  try {
    await env.POLL_ROOM.getByName(publicId).notifyChange();
  } catch (err) {
    console.error("poll-room notify failed", { publicId, error: String(err) });
  }
}

/** Fire-and-forget: (re)arm the poll's close alarm; null cancels. Never throws. */
export async function schedulePollClose(publicId: string, expiresAt: Date | null): Promise<void> {
  try {
    await env.POLL_ROOM.getByName(publicId).scheduleClose(expiresAt?.getTime() ?? null);
  } catch (err) {
    console.error("poll-room schedule failed", { publicId, error: String(err) });
  }
}
