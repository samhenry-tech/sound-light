/**
 * Ephemeral playback state, fed by the active MusicPlayer's events and read by
 * the now-playing bar + Live cards. The imperative player and the actions that
 * drive it live in <PlayerProvider>; this store is just the observable state.
 */
import { create } from 'zustand';

import type { MusicTrack, PlaybackState } from '~music/types';
import type { Atmosphere } from '~theme/atmosphere';

export interface HistoryEntry {
  track: MusicTrack;
  mixName: string;
  at: number;
}

export interface NowPlaying {
  playingMixId: string | null;
  current: MusicTrack | null;
  mixName: string;
  atmosphere: Atmosphere | null;
  coverBg: string;
}

const HISTORY_LIMIT = 50;

interface PlayerState extends NowPlaying {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  queue: MusicTrack[];
  history: HistoryEntry[];
  holding: boolean;
  volume: number;
  muted: boolean;

  /** Begin a mix: set now-playing metadata + the shuffled queue. */
  startMix: (payload: NowPlaying & { queue: MusicTrack[]; current: MusicTrack | null }) => void;
  /** Apply a state snapshot from the player. */
  applyPlayback: (state: PlaybackState) => void;
  setCurrent: (track: MusicTrack) => void;
  setQueue: (queue: MusicTrack[]) => void;
  /** Pop the next track from the queue (returns undefined when empty). */
  dequeue: () => MusicTrack | undefined;
  setHolding: (holding: boolean) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  pushHistory: (entry: HistoryEntry) => void;
  /** Epoch ms when the sleep timer fires, or null when inactive. */
  sleepEndsAt: number | null;
  setSleepEndsAt: (endsAt: number | null) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  playingMixId: null,
  current: null,
  mixName: '',
  atmosphere: null,
  coverBg: '',
  isPlaying: false,
  positionMs: 0,
  durationMs: 0,
  queue: [],
  history: [],
  holding: false,
  volume: 0.8,
  muted: false,
  sleepEndsAt: null,

  startMix: ({ playingMixId, current, mixName, atmosphere, coverBg, queue }) =>
    set({
      playingMixId,
      current,
      mixName,
      atmosphere,
      coverBg,
      queue,
      positionMs: 0,
      isPlaying: true,
    }),

  applyPlayback: (state) =>
    set((prev) => ({
      current: state.track ?? prev.current,
      isPlaying: state.isPlaying,
      positionMs: state.positionMs,
      durationMs: state.durationMs || prev.durationMs,
    })),

  setCurrent: (current) => set({ current, positionMs: 0 }),
  setQueue: (queue) => set({ queue }),
  dequeue: () => {
    const [next, ...rest] = get().queue;
    if (!next) return undefined;
    set({ queue: rest });
    return next;
  },
  setHolding: (holding) => set({ holding }),
  setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)), muted: false }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  pushHistory: (entry) => set((s) => ({ history: [entry, ...s.history].slice(0, HISTORY_LIMIT) })),
  setSleepEndsAt: (sleepEndsAt) => set({ sleepEndsAt }),
  reset: () =>
    set({
      playingMixId: null,
      current: null,
      mixName: '',
      atmosphere: null,
      coverBg: '',
      isPlaying: false,
      positionMs: 0,
      durationMs: 0,
      queue: [],
    }),
}));
