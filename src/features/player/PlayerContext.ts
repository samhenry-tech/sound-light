import { createContext, useContext } from 'react';

import type { Playlist } from '~/models/playlist';

/** Imperative player actions exposed to the UI. State is read from the stores. */
export interface PlayerActions {
  /** Crossfade into a playlist: send all track URIs to Spotify with shuffle + repeat. */
  selectPlaylist: (playlist: Playlist) => Promise<void>;
  togglePlay: () => void;
  /** 👎 tap — skip to the next track in the Spotify context. */
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
}

export const PlayerContext = createContext<PlayerActions | null>(null);

export const usePlayerActions = (): PlayerActions => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayerActions must be used within <PlayerProvider>');
  return ctx;
};
