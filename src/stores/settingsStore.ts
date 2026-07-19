/**
 * Device-level player settings, persisted to localStorage (currently just the
 * crossfade duration), distinct from the synced UserSettings in the data layer.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { APP_NAME } from '~constants';

interface SettingsState {
  /** Crossfade duration in ms when switching playlists / skipping (0 disables). */
  crossfadeMs: number;

  setCrossfadeMs: (ms: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      crossfadeMs: 2000,

      setCrossfadeMs: (crossfadeMs) =>
        set({ crossfadeMs: Math.min(8000, Math.max(0, crossfadeMs)) }),
    }),
    { name: `${APP_NAME}.settings` },
  ),
);
