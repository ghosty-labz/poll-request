import { Link } from "@tanstack/react-router";

/**
 * Full-page 404 for poll routes that don't resolve — an unmatched `/polls/*`
 * URL or a poll that's expired, deleted, or never existed. Self-contained
 * (own nav + footer) so it can stand alone in a route or replace the poll view.
 */
export function PollNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-cream font-plex text-ink">
      {/* nav */}
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between border-b-2 border-ink px-11 py-5.5">
        <Link to="/" className="flex items-center gap-2.75 no-underline">
          <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md bg-ink font-pixel text-[11px] text-neon">
            PR
          </span>
          <span className="font-plex text-[15px] font-bold text-ink">
            poll_request
          </span>
        </Link>
        <span className="font-plex text-xs font-semibold text-[#5c6356]">
          error · 404
        </span>
      </div>

      {/* body */}
      <div className="flex flex-1 items-center justify-center px-7 pb-16 pt-12">
        <div className="w-full max-w-[600px] text-center">
          {/* floating ghosts */}
          <div className="mb-[34px] flex h-[84px] items-end justify-center gap-[30px]">
            <div className="animate-pr-float">
              <Ghost color="#ff4d5e" />
            </div>
            <div className="scale-125">
              <div className="animate-pr-float3">
                <Ghost color="#14160f" />
              </div>
            </div>
            <div className="animate-pr-float2">
              <Ghost color="#1fae0a" />
            </div>
          </div>

          {/* 404 */}
          <div className="relative inline-block font-pixel text-[58px] leading-none tracking-[2px] text-ink">
            4<span className="animate-pr-blink text-neon-deep">0</span>4
          </div>

          <div className="mt-[30px] inline-block rounded-[5px] border-2 border-ink bg-neon px-3 py-[5px] font-plex text-xs font-bold tracking-[0.04em] text-ink">
            // poll not found
          </div>

          <h1 className="mt-[22px] font-plex text-[22px] font-bold leading-[1.5] text-ink">
            This Poll Request hit a merge conflict
          </h1>
          <p className="mx-auto mt-4 max-w-[440px] font-plex text-[15px] leading-[1.75] text-[#54594c]">
            The link you followed is expired, deleted, or never existed. Like a
            stash you can’t pop — it’s just gone.
          </p>

          {/* terminal readout */}
          <div className="mx-auto mt-[30px] max-w-[460px] rounded-[11px] border-2 border-ink bg-ink px-5 py-[18px] text-left font-plex text-[13px] font-medium leading-[1.85] shadow-[6px_6px_0_var(--color-neon)]">
            <div className="text-[#8fa886]">
              $ poll fetch tabs-or-spaces-x7f2
            </div>
            <div className="text-[#ff8a93]">
              fatal: poll &apos;<span className="text-[#ffb84d]">x7f2</span>
              &apos; does not exist
            </div>
            <div className="text-[#d6efce]">
              hint: it may have been closed, deleted, or it’s a typo
            </div>
            <div className="text-neon">
              → try opening a fresh one{" "}
              <span className="animate-pr-pulse">▍</span>
            </div>
          </div>

          {/* actions */}
          <div className="mt-[30px] flex flex-wrap justify-center gap-[13px]">
            <Link
              to="/polls/new"
              className="inline-flex items-center gap-[9px] rounded-[9px] border-2 border-ink bg-ink px-6 py-[15px] font-plex text-sm font-bold text-neon no-underline shadow-[4px_4px_0_var(--color-neon)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-neon)]"
            >
              Open a new poll →
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-[9px] rounded-[9px] border-2 border-ink bg-white px-6 py-[15px] font-plex text-sm font-bold text-ink no-underline transition-colors hover:bg-neon"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-center border-t-2 border-ink px-11 py-[22px] font-plex text-xs font-semibold text-[#5c6356]">
        <span>poll_request © 2026 · merge opinions, not conflicts</span>
      </div>
    </div>
  );
}

/** The little mascot ghost from the design (a `dc-import` in the source). */
function Ghost({ color }: { color: string }) {
  return (
    <svg
      width="52"
      height="52"
      viewBox="0 0 40 44"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 19C4 9 10.6 2 20 2C29.4 2 36 9 36 19V39L32 35L28 39L24 35L20 39L16 35L12 39L8 35L4 39Z"
        fill={color}
      />
      <ellipse cx="14.5" cy="18" rx="3" ry="4" fill="#fff" />
      <ellipse cx="25.5" cy="18" rx="3" ry="4" fill="#fff" />
      <circle cx="15.3" cy="19" r="1.6" fill="#14160f" />
      <circle cx="26.3" cy="19" r="1.6" fill="#14160f" />
    </svg>
  );
}
