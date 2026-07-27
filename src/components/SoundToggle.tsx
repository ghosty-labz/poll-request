import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { play, readSoundPreference, setSoundEnabled } from "#/lib/sound";

/**
 * Mutes/unmutes the interaction sounds. Renders as "on" during SSR and
 * corrects itself from localStorage on mount, the same way ThemeToggle does.
 */
export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(readSoundPreference());
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    // Unmuting should be audible — confirm with the sound you just switched on.
    if (next) play("chime");
  }

  const label = enabled ? "Mute interaction sounds" : "Unmute interaction sounds";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={label}
      title={label}
      className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md border-2 border-ink bg-white text-ink transition-colors hover:bg-neon"
    >
      {enabled ? (
        <Volume2 size={15} strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <VolumeX size={15} strokeWidth={2.5} aria-hidden="true" />
      )}
    </button>
  );
}
