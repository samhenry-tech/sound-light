import { type Atmosphere,capitalize } from '~theme/atmosphere';

/** Display name for a mix: "{location} – {Atmosphere}" (en-dash, per handoff). */
export const mixName = (location: string, atmosphere: Atmosphere): string => {
  return `${location} – ${capitalize(atmosphere)}`;
};

/** Seconds → "m:ss". */
export const formatTime = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

/** Format milliseconds (Spotify reports durations in ms) → "m:ss". */
export const formatMs = (ms: number): string => {
  return formatTime(ms / 1000);
};

/** Fisher–Yates shuffle that returns a new array (does not mutate input). */
export const shuffle = <T>(items: readonly T[]): T[] => {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
};

/** Pick a random element, or undefined for an empty list. */
export const sample = <T>(items: readonly T[]): T | undefined => {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
};
