import { FormCard, StepLabel } from "./FormCard";

interface QuestionFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** Step 01 — the poll question. */
export function QuestionField({ value, onChange }: QuestionFieldProps) {
  return (
    <FormCard>
      <StepLabel className="mb-3 block">01 · Your question</StepLabel>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tabs or spaces? Settle it once and for all…"
        className="w-full resize-none rounded-lg border-2 border-ink bg-cream px-[15px] py-[14px] font-plex text-[17px] font-semibold text-ink outline-none placeholder:text-[#a3a899] focus:border-neon-deep focus:shadow-[3px_3px_0_var(--color-neon)]"
      />
    </FormCard>
  );
}
