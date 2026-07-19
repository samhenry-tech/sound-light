/**
 * Device-level player settings, persisted to localStorage. These are tuning
 * preferences (crossfade, ambient bed, keyboard) distinct from the synced
 * UserSettings (accent / columns / card label) that live in the data layer.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { APP_NAME } from '~constants';

export type AmbientKind = 'rain' | 'wind' | 'fire' | 'ocean';

export const AMBIENT_KINDS: AmbientKind[] = ['rain', 'wind', 'fire', 'ocean'];

interface SettingsState {
  /** Crossfade duration in ms when switching playlists / skipping (0 disables). */
  crossfadeMs: number;
  /** Volume of the procedural ambient bed (0..1). */
  ambientVolume: number;
  /** Currently selected ambient bed, or null when off. */
  ambientKind: AmbientKind | null;

  setCrossfadeMs: (ms: number) => void;
  setAmbientVolume: (v: number) => void;
  setAmbientKind: (kind: AmbientKind | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      crossfadeMs: 2000,
      ambientVolume: 0.4,
      ambientKind: null,

      setCrossfadeMs: (crossfadeMs) =>
        set({ crossfadeMs: Math.min(8000, Math.max(0, crossfadeMs)) }),
      setAmbientVolume: (ambientVolume) =>
        set({ ambientVolume: Math.min(1, Math.max(0, ambientVolume)) }),
      setAmbientKind: (ambientKind) => set({ ambientKind }),
    }),
    { name: `${APP_NAME}.settings` },
  ),
);
