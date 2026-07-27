import type { PollDurationHours } from "#/lib/poll/contracts";
import { FormCard, StepLabel } from "./FormCard";
import {
  DURATION_OPTIONS,
  FORMAT_OPTIONS,
  RULE_TOGGLES,
  type PollDraft,
  type PollFormat,
} from "./types";

interface PollRulesProps {
  draft: PollDraft;
  onFormatChange: (format: PollFormat) => void;
  onDurationChange: (hours: PollDurationHours) => void;
  onToggle: (key: "anon" | "allowChanges" | "showResults") => void;
}

/** Step 03 — voting format, poll length + behaviour toggles. */
export function PollRules({
  draft,
  onFormatChange,
  onDurationChange,
  onToggle,
}: PollRulesProps) {
  return (
    <FormCard>
      <StepLabel className="mb-4 block">03 · Rules</StepLabel>

      <div className="mb-[9px] font-plex text-xs font-semibold text-[#54594c]">
        Voting format
      </div>
      <div className="mb-[22px] grid grid-cols-3 gap-[10px]">
        {FORMAT_OPTIONS.map((fmt) => {
          const active = draft.format === fmt.key;
          return (
            <button
              type="button"
              key={fmt.key}
              onClick={() => onFormatChange(fmt.key)}
              aria-pressed={active}
              data-cuelume-toggle="toggle"
              className={`rounded-lg border-2 border-ink px-3 py-[13px] text-center transition-shadow ${
                active
                  ? "bg-neon shadow-[3px_3px_0_var(--color-ink)]"
                  : "bg-white text-[#54594c]"
              }`}
            >
              <div className="mb-1 font-plex text-[13px] font-bold">
                {fmt.label}
              </div>
              <div className="font-plex text-[10px] leading-[1.4] opacity-70">
                {fmt.hint}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-[9px] font-plex text-xs font-semibold text-[#54594c]">
        Poll length
      </div>
      <div className="mb-[22px] grid grid-cols-3 gap-[10px]">
        {DURATION_OPTIONS.map((dur) => {
          const active = draft.durationHours === dur.hours;
          return (
            <button
              type="button"
              key={dur.hours}
              onClick={() => onDurationChange(dur.hours)}
              aria-pressed={active}
              data-cuelume-toggle="toggle"
              className={`rounded-lg border-2 border-ink px-3 py-[13px] text-center transition-shadow ${
                active
                  ? "bg-neon shadow-[3px_3px_0_var(--color-ink)]"
                  : "bg-white text-[#54594c]"
              }`}
            >
              <div className="mb-1 font-plex text-[13px] font-bold">
                {dur.label}
              </div>
              <div className="font-plex text-[10px] leading-[1.4] opacity-70">
                {dur.hint}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col">
        {RULE_TOGGLES.map((t) => {
          const on = draft[t.key];
          return (
            <button
              disabled
              type="button"
              key={t.key}
              onClick={() => onToggle(t.key)}
              aria-pressed={on}
              className="flex items-center justify-between gap-[14px] border-t border-[#e5e4d6] py-[13px] text-left first:border-t-0"
            >
              <span>
                <span className="block font-plex text-[13px] font-semibold text-ink">
                  {t.label}
                </span>
                <span className="mt-[2px] block font-plex text-[11px] text-[#9aa091]">
                  {t.hint}
                </span>
              </span>
              <span
                className={`relative h-[26px] w-[46px] shrink-0 rounded-full border-2 border-ink transition-colors ${
                  on ? "bg-neon" : "bg-[#e5e4d6]"
                }`}
              >
                <span
                  className={`absolute top-px h-5 w-5 rounded-full bg-ink transition-[left] ${
                    on ? "left-[22px]" : "left-px"
                  }`}
                />
              </span>
            </button>
          );
        })}
      </div>
    </FormCard>
  );
}
