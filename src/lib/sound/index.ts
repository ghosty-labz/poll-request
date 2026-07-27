/**
 * The app's seam over cuelume — every sound the UI makes goes through here.
 *
 * Cuelume synthesizes its sounds live via the Web Audio API, so there is
 * nothing to preload and `play()` is a safe no-op during SSR, before the
 * visitor's first gesture, and where Web Audio is unavailable.
 *
 * Two ways to make noise:
 *   - declaratively, via `data-cuelume-press` / `-release` / `-hover` /
 *     `-toggle` attributes on an element (wired up once by `initSounds`);
 *   - imperatively, via `play("success")` for outcomes rather than gestures.
 *
 * Muting is a per-browser preference stored in localStorage, mirroring how
 * the theme preference is handled.
 */
import { bind, play, setEnabled, type SoundName } from "cuelume";

export type { SoundName };
export { play };

const STORAGE_KEY = "sound";

/** Whether sounds are on for this browser. Defaults to on. */
export function readSoundPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    // Storage blocked (private mode, cookie settings) — fall back to on.
    return true;
  }
}

/** Applies a mute preference immediately and remembers it for next visit. */
export function setSoundEnabled(enabled: boolean): void {
  setEnabled(enabled);
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // The preference just won't survive a reload.
  }
}

/**
 * Applies the stored preference and starts the delegated listeners that back
 * every `data-cuelume-*` attribute. Call once, from the root document.
 */
export function initSounds(): void {
  if (typeof window === "undefined") return;
  setEnabled(readSoundPreference());
  bind();
}
