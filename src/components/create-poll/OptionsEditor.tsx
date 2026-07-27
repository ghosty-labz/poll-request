import { FormCard, StepLabel } from "./FormCard";
import {
  MAX_OPTIONS,
  MIN_OPTIONS,
  OPTION_LETTERS,
  placeholderFor,
  type PollOptionDraft,
} from "./types";

interface OptionsEditorProps {
  options: PollOptionDraft[];
  onChangeOption: (id: number, text: string) => void;
  onAddOption: () => void;
  onRemoveOption: (id: number) => void;
}

/** Step 02 — the editable list of options (2–10). */
export function OptionsEditor({
  options,
  onChangeOption,
  onAddOption,
  onRemoveOption,
}: OptionsEditorProps) {
  const cantAdd = options.length >= MAX_OPTIONS;
  const cantRemove = options.length <= MIN_OPTIONS;

  return (
    <FormCard>
      <div className="mb-[14px] flex items-baseline justify-between">
        <StepLabel>02 · Options</StepLabel>
        <span className="font-plex text-[11px] font-medium text-[#a3a899]">
          {options.length} / {MAX_OPTIONS}
        </span>
      </div>

      <div className="flex flex-col gap-[11px]">
        {options.map((opt, i) => (
          <div key={opt.id} className="flex items-center gap-[11px]">
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md border-2 border-ink bg-neon font-plex text-xs font-bold text-ink">
              {OPTION_LETTERS[i] ?? i + 1}
            </span>
            <input
              value={opt.text}
              onChange={(e) => onChangeOption(opt.id, e.target.value)}
              placeholder={placeholderFor(i)}
              className="min-w-0 flex-1 rounded-lg border-2 border-ink bg-cream px-[13px] py-[11px] font-plex text-sm font-medium text-ink outline-none placeholder:text-[#a3a899] focus:border-neon-deep focus:shadow-[3px_3px_0_var(--color-neon)]"
            />
            <button
              type="button"
              onClick={() => onRemoveOption(opt.id)}
              disabled={cantRemove}
              aria-label={`Remove option ${OPTION_LETTERS[i] ?? i + 1}`}
              data-cuelume-press="press"
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-white font-plex text-base font-bold leading-none text-ink transition-colors hover:enabled:bg-[#ff4d5e] hover:enabled:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddOption}
        disabled={cantAdd}
        data-cuelume-press="tick"
        className="mt-[14px] inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-ink bg-cream px-4 py-[10px] font-plex text-[13px] font-bold text-ink transition-colors hover:enabled:bg-neon disabled:cursor-not-allowed disabled:opacity-30"
      >
        + add option
      </button>
    </FormCard>
  );
}
