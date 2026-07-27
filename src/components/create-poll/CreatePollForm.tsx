import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type {
  CreatePollRequest,
  CreatePollResponse,
  PollDurationHours,
} from "#/lib/poll/contracts";
import { play } from "#/lib/sound";
import { LivePreview } from "./LivePreview";
import { OptionsEditor } from "./OptionsEditor";
import { PollRules } from "./PollRules";
import { QuestionField } from "./QuestionField";
import {
  MAX_OPTIONS,
  MIN_OPTIONS,
  type PollDraft,
  type PollFormat,
} from "./types";

const INITIAL_DRAFT: PollDraft = {
  question: "",
  options: [
    { id: 1, text: "" },
    { id: 2, text: "" },
  ],
  format: "single",
  durationHours: 24,
  anon: true,
  allowChanges: true,
  showResults: false,
};

/**
 * The full Create Poll experience: editable draft on the left, live preview on
 * the right. Submits the supported fields (title, duration + options) to
 * POST /api/polls.
 *
 * Note: format & rule toggles are captured in the UI but not yet persisted —
 * the backend contract currently accepts title, description, expiry & options.
 */
export function CreatePollForm() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<PollDraft>(INITIAL_DRAFT);
  const [nextId, setNextId] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const filledOptions = useMemo(
    () => draft.options.filter((o) => o.text.trim()).length,
    [draft.options],
  );
  const canCreate =
    Boolean(draft.question.trim()) && filledOptions >= MIN_OPTIONS;

  const setQuestion = (question: string) =>
    setDraft((d) => ({ ...d, question }));

  const changeOption = (id: number, text: string) =>
    setDraft((d) => ({
      ...d,
      options: d.options.map((o) => (o.id === id ? { ...o, text } : o)),
    }));

  const addOption = () =>
    setDraft((d) => {
      if (d.options.length >= MAX_OPTIONS) return d;
      setNextId((n) => n + 1);
      return { ...d, options: [...d.options, { id: nextId, text: "" }] };
    });

  const removeOption = (id: number) =>
    setDraft((d) =>
      d.options.length <= MIN_OPTIONS
        ? d
        : { ...d, options: d.options.filter((o) => o.id !== id) },
    );

  const setFormat = (format: PollFormat) => setDraft((d) => ({ ...d, format }));

  const setDuration = (durationHours: PollDurationHours) =>
    setDraft((d) => ({ ...d, durationHours }));

  const toggle = (key: "anon" | "allowChanges" | "showResults") =>
    setDraft((d) => ({ ...d, [key]: !d[key] }));

  const create = async () => {
    if (!canCreate || submitting) return;
    setSubmitting(true);
    setError(null);
    play("loading");
    try {
      const body: CreatePollRequest = {
        title: draft.question.trim(),
        durationHours: draft.durationHours,
        options: draft.options
          .filter((o) => o.text.trim())
          .map((o) => ({ text: o.text.trim() })),
      };
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(data?.message ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as CreatePollResponse;
      setShareUrl(data.shareUrl);
      play("success");

      // Carry the management key forward — it's returned only once, at creation.
      // Landing on the poll screen with the key unlocks the manager controls.
      const managementKey =
        new URL(data.manageUrl).searchParams.get("key") ?? undefined;
      await navigate({
        to: "/polls/$publicId",
        params: { publicId: data.poll.id },
        search: { key: managementKey },
      });
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      play("error");
    } finally {
      setSubmitting(false);
    }
  };

  const createHint = shareUrl
    ? "live — share the link →"
    : canCreate
      ? "one link, ready to share"
      : "add a question + 2 options to push";

  return (
    <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1.25fr_1fr]">
      {/* form */}
      <div className="flex flex-col gap-6">
        <QuestionField value={draft.question} onChange={setQuestion} />
        <OptionsEditor
          options={draft.options}
          onChangeOption={changeOption}
          onAddOption={addOption}
          onRemoveOption={removeOption}
        />
        <PollRules
          draft={draft}
          onFormatChange={setFormat}
          onDurationChange={setDuration}
          onToggle={toggle}
        />

        <div className="flex flex-wrap items-center gap-[18px]">
          <button
            type="button"
            onClick={create}
            disabled={!canCreate || submitting}
            data-cuelume-hover="chime"
            data-cuelume-press="press"
            className="inline-flex items-center gap-[9px] rounded-lg border-2 border-ink bg-ink px-7 py-4 font-plex text-[15px] font-bold text-neon shadow-[5px_5px_0_var(--color-neon)] transition-transform hover:enabled:-translate-x-0.5 hover:enabled:-translate-y-0.5 hover:enabled:shadow-[7px_7px_0_var(--color-neon)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-[5px_5px_0_#c9c8ba]"
          >
            {submitting ? "pushing…" : "$ poll push →"}
          </button>
          <span className="font-plex text-xs font-medium text-[#9aa091]">
            {createHint}
          </span>
        </div>

        {error && (
          <div className="rounded-lg border-2 border-[#ff4d5e] bg-[#ffecee] px-4 py-3 font-plex text-[13px] font-semibold text-[#9f3030]">
            {error}
          </div>
        )}
      </div>

      {/* preview */}
      <LivePreview draft={draft} shareUrl={shareUrl} />
    </div>
  );
}
