import { useCallback, useState } from "react";
import { play } from "#/lib/sound";

/** Copies `text` to the clipboard and flips a label for ~1.6s. */
export function useCopy(text: string): [boolean, () => void] {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard?.writeText(text).catch(() => {});
    play("droplet");
    setCopied(true);
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [text]);
  return [copied, copy];
}

interface ShareStripProps {
  url: string;
}

/** The "link · …url… · copy" strip beneath the poll card. */
export function ShareStrip({ url }: ShareStripProps) {
  const [copied, copy] = useCopy(url);
  const display = url.replace(/^https?:\/\//, "");

  return (
    <div className="mt-[18px] flex items-center gap-[11px] rounded-[10px] border-2 border-ink bg-white px-4 py-[13px] shadow-[4px_4px_0_var(--color-ink)]">
      <span className="font-plex text-xs font-bold text-neon-deep">link</span>
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-plex text-xs font-medium text-[#54594c]">
        {display}
      </span>
      <button
        type="button"
        onClick={copy}
        data-cuelume-hover="whisper"
        className="rounded-[7px] border-2 border-ink bg-neon px-[13px] py-[7px] font-plex text-xs font-bold text-ink transition-transform hover:-translate-x-px hover:-translate-y-px hover:shadow-[2px_2px_0_var(--color-ink)]"
      >
        {copied ? "copied ✓" : "copy"}
      </button>
    </div>
  );
}
