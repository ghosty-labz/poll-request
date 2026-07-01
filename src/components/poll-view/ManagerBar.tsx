import { useCopy } from "./ShareStrip";

interface ManagerBarProps {
  expired: boolean;
  busy: boolean;
  shareUrl: string;
  /** Current front-runner once results are visible, else null. */
  leader: { label: string; pct: number } | null;
  onToggleStatus: () => void;
  onDelete: () => void;
}

/**
 * The dark "Manager controls" bar shown to whoever holds the management key.
 * Exposes the manager actions backed by the API: close/reopen (via expiry),
 * copy link and delete.
 */
export function ManagerBar({
  expired,
  busy,
  shareUrl,
  leader,
  onToggleStatus,
  onDelete,
}: ManagerBarProps) {
  const [copied, copy] = useCopy(shareUrl);

  const darkBtn =
    "inline-flex items-center gap-[7px] rounded-lg border-2 border-[#2c3a24] bg-[#1c2417] px-[14px] py-[9px] font-plex text-xs font-bold text-[#d6efce] disabled:opacity-50";

  return (
    <div className="mb-[26px] rounded-xl border-2 border-ink bg-ink px-5 py-[18px] shadow-[5px_5px_0_var(--color-neon)]">
      <div className="flex flex-wrap items-center justify-between gap-[14px]">
        <div className="flex items-center gap-[10px]">
          <span className="font-pixel text-[11px] text-neon">★</span>
          <div>
            <div className="font-plex text-[13px] font-bold text-neon">Manager controls</div>
            <div className="mt-[2px] font-plex text-[11px] text-[#8fa886]">
              You opened this Poll Request — you call the merge.
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-[9px]">
          <button
            type="button"
            onClick={onToggleStatus}
            disabled={busy}
            className="inline-flex items-center gap-[7px] rounded-lg border-2 border-neon bg-transparent px-[14px] py-[9px] font-plex text-xs font-bold text-neon transition-colors hover:enabled:bg-neon hover:enabled:text-ink disabled:opacity-50"
          >
            {expired ? "reopen voting" : "close voting"}
          </button>
          <button type="button" onClick={copy} className={`${darkBtn} hover:border-neon`}>
            {copied ? "copied ✓" : "copy link"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className={`${darkBtn} !text-[#ff8a93] hover:enabled:border-[#ff4d5e] hover:enabled:bg-[#ff4d5e] hover:enabled:!text-white`}
          >
            delete
          </button>
        </div>
      </div>

      {leader && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-[14px] border-t border-[#2c3a24] pt-[15px]">
          <div className="font-plex text-xs font-semibold text-[#8fa886]">
            Current leader:{" "}
            <span className="font-bold text-neon">{leader.label}</span> · {leader.pct}%
          </div>
        </div>
      )}
    </div>
  );
}
