/** Shared types & constants for the Create Poll form. */

export type PollFormat = "single" | "multi" | "ranked";

export interface PollOptionDraft {
  id: number;
  text: string;
}

export interface PollDraft {
  question: string;
  options: PollOptionDraft[];
  format: PollFormat;
  anon: boolean;
  allowChanges: boolean;
  showResults: boolean;
}

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;

export const OPTION_LETTERS = "ABCDEFGHIJ";

/** Playful placeholders that cycle through the option rows. */
export const OPTION_PLACEHOLDERS = [
  "Tabs",
  "Spaces",
  "I let Prettier fight it out",
  "Whatever the linter says",
  "rebase",
  "merge",
];

export const FORMAT_OPTIONS: Array<{
  key: PollFormat;
  label: string;
  hint: string;
}> = [
  { key: "single", label: "Single", hint: "pick one" },
  { key: "multi", label: "Multi", hint: "pick many" },
  { key: "ranked", label: "Ranked", hint: "order them" },
];

export const RULE_TOGGLES: Array<{
  key: "anon" | "allowChanges" | "showResults";
  label: string;
  hint: string;
}> = [
  { key: "anon", label: "Anonymous voting", hint: "No names attached to votes." },
  {
    key: "allowChanges",
    label: "Allow vote changes",
    hint: "Voters can switch their pick anytime.",
  },
  {
    key: "showResults",
    label: "Show results before voting",
    hint: "Off = results hidden until they vote.",
  },
];

export const FORMAT_LABELS: Record<PollFormat, string> = {
  single: "single choice",
  multi: "multiple choice",
  ranked: "ranked choice",
};

export function placeholderFor(index: number): string {
  return OPTION_PLACEHOLDERS[index] ?? `Option ${OPTION_LETTERS[index] ?? index + 1}`;
}
