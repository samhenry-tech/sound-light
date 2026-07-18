import { createContext, useContext } from 'react';

import type { Playlist } from '~shared/contract';

/** Imperative player actions exposed to the UI. State is read from the stores. */
export interface PlayerActions {
  /** Crossfade into a playlist: resolve tracks, build a shuffled queue, play. */
  selectPlaylist: (playlist: Playlist) => Promise<void>;
  togglePlay: () => void;
  /** 👎 tap — fade out and skip to the next track. */
  skip: () => void;
  /** Manual advance with no toast. */
  next: () => void;
  /** 👍 — mark the current track a good fit. */
  like: () => void;
  /** Banish the current track from this playlist (keyboard / palette equivalent of hold). */
  banish: () => void;
  /** Pointer-down on 👎 — begins the hold-to-banish timer. */
  startHold: () => void;
  /** Pointer-up — if the hold hasn't completed, just skip. */
  endHold: () => void;
  /** Pointer-leave — cancel the hold without skipping. */
  cancelHold: () => void;
  seek: (positionMs: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  /** Start a sleep timer that fades out + pauses after `minutes`. */
  startSleepTimer: (minutes: number) => void;
  cancelSleepTimer: () => void;
}

export const PlayerContext = createContext<PlayerActions | null>(null);

export const usePlayerActions = (): PlayerActions => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayerActions must be used within <PlayerProvider>');
  return ctx;
};
