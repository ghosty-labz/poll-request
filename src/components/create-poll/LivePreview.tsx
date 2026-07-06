import { useState } from "react";
import { StepLabel } from "./FormCard";
import { FORMAT_LABELS, placeholderFor, type PollDraft } from "./types";

interface LivePreviewProps {
  draft: PollDraft;
  /** Real share link once the poll has been created, otherwise null. */
  shareUrl: string | null;
}

/** Sticky right column: a live mock of the poll plus its share link. */
export function LivePreview({ draft, shareUrl }: LivePreviewProps) {
  const formatLabel = FORMAT_LABELS[draft.format];
  const question = draft.question.trim() || "Your question shows up here…";
  const meta = [
    draft.anon ? "anonymous" : "named",
    formatLabel,
    `closes in ${draft.durationHours}h`,
  ].join(" · ");

  return (
    <div className="sticky top-6">
      <StepLabel className="mb-3 block">Live preview</StepLabel>

      <div className="rounded-xl border-2 border-ink bg-white px-6 pb-5 pt-6 shadow-[7px_7px_0_var(--color-ink)]">
        <div className="flex items-center justify-between">
          <span className="font-plex text-[11px] font-bold uppercase tracking-[0.14em] text-[#5c6356]">
            {formatLabel}
          </span>
          <span className="flex items-center gap-[7px] font-plex text-[11px] font-bold text-ink">
            <span className="h-2 w-2 animate-pulse rounded-full bg-neon-deep" />
            LIVE
          </span>
        </div>

        <div className="my-[18px] mt-[14px] font-plex text-[19px] font-bold leading-[1.4] text-ink">
          {question}
        </div>

        <div className="flex flex-col gap-[11px]">
          {draft.options.map((opt, i) => {
            const filled = opt.text.trim();
            const text = filled || placeholderFor(i);
            return (
              <div
                key={opt.id}
                className="flex items-center gap-[11px] rounded-lg border-2 border-ink bg-cream px-[14px] py-3"
              >
                <span
                  className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center border-2 border-ink font-plex text-[11px] font-bold text-ink ${
                    draft.format === "ranked"
                      ? "rounded-full bg-neon"
                      : draft.format === "single"
                        ? "rounded-full"
                        : "rounded"
                  }`}
                >
                  {draft.format === "ranked"
                    ? i + 1
                    : draft.format === "single"
                      ? "○"
                      : "▢"}
                </span>
                <span
                  className={`font-plex text-sm font-semibold ${
                    filled ? "text-ink" : "text-[#bdc2b3]"
                  }`}
                >
                  {text}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-[18px] flex justify-between border-t border-[#e5e4d6] pt-[14px] font-plex text-[11px] font-semibold text-[#5c6356]">
          <span>0 votes cast</span>
          <span>{meta}</span>
        </div>
      </div>

      <ShareLink shareUrl={shareUrl} />
    </div>
  );
}

function ShareLink({ shareUrl }: { shareUrl: string | null }) {
  const [copied, setCopied] = useState(false);
  const display = shareUrl ?? "pollrequest.dev/p/your-poll-id";

  const copy = () => {
    if (!shareUrl) return;
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="mt-4 flex items-center gap-[9px] rounded-lg border-2 border-ink bg-white px-[14px] py-[11px] shadow-[3px_3px_0_var(--color-ink)]">
      <span className="font-plex text-xs font-bold text-neon-deep">link</span>
      <span
        className={`overflow-hidden text-ellipsis whitespace-nowrap font-plex text-xs font-medium ${
          shareUrl ? "text-ink" : "text-[#9aa091]"
        }`}
      >
        {display}
      </span>
      <button
        type="button"
        onClick={copy}
        disabled={!shareUrl}
        className="ml-auto shrink-0 rounded-md border-[1.5px] border-ink bg-neon px-2 py-[3px] font-plex text-[11px] font-bold text-ink disabled:opacity-100"
      >
        {shareUrl ? (copied ? "copied!" : "copy") : "created on push"}
      </button>
    </div>
  );
}
