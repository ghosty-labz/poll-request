import type { PollOptionView } from "#/lib/poll/contracts";

interface OptionRowProps {
  option: PollOptionView;
  /** Results revealed (counts/percentages are non-null). */
  showResults: boolean;
  /** Voting still allowed (poll open). */
  votable: boolean;
  onVote: (optionId: string) => void;
}

/** A single poll option with its result bar, selection mark and percentage. */
export function OptionRow({ option, showResults, votable, onVote }: OptionRowProps) {
  const selected = option.selected;
  const pct = option.percentage ?? 0;

  return (
    <button
      type="button"
      disabled={!votable}
      onClick={() => votable && onVote(option.id)}
      className={`relative w-full overflow-hidden rounded-[10px] border-2 border-ink bg-cream px-4 py-[14px] text-left ${
        votable ? "cursor-pointer hover:bg-[#eafde3]" : "cursor-default opacity-[0.92]"
      }`}
    >
      {/* result bar */}
      <span
        className={`absolute inset-y-0 left-0 transition-[width] duration-500 ease-[cubic-bezier(.4,0,.2,1)] ${
          selected ? "bg-neon" : "bg-[rgba(57,255,20,0.34)]"
        }`}
        style={{ width: `${showResults ? pct : 0}%` }}
      />
      <span className="relative flex items-center gap-[13px]">
        <span
          className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-2 border-ink font-plex text-xs font-bold text-ink ${
            selected ? "bg-neon" : "bg-white"
          }`}
        >
          {selected ? "✓" : "○"}
        </span>
        <span className="flex flex-1 items-center gap-[9px] font-plex text-[15px] font-semibold text-ink">
          {option.text}
          {selected && (
            <span className="rounded bg-ink px-[6px] py-[2px] font-plex text-[9px] font-bold tracking-[0.06em] text-neon">
              YOUR PICK
            </span>
          )}
        </span>
        {showResults && (
          <span className="whitespace-nowrap font-plex text-sm font-bold text-ink">{pct}%</span>
        )}
      </span>
    </button>
  );
}
