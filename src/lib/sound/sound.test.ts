import { beforeEach, describe, expect, it } from "vitest";
import { initSounds, readSoundPreference, setSoundEnabled } from "./index";

describe("sound preference", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to on when nothing is stored", () => {
    expect(readSoundPreference()).toBe(true);
  });

  it("round-trips a mute through localStorage", () => {
    setSoundEnabled(false);
    expect(readSoundPreference()).toBe(false);

    setSoundEnabled(true);
    expect(readSoundPreference()).toBe(true);
  });

  it("treats any value other than 'off' as on", () => {
    window.localStorage.setItem("sound", "nonsense");
    expect(readSoundPreference()).toBe(true);
  });

  it("binds without a Web Audio implementation present", () => {
    expect(() => {
      initSounds();
      initSounds(); // binding the same root twice is a no-op
    }).not.toThrow();
  });
});
