/**
 * Mock player — a faithful port of the prototype's `setInterval` progress
 * ticker. Advances position once per second and fires `onEnded` when a track
 * completes, with no Spotify account or Premium required.
 */
import type { PlaybackState, SpotifyTrack } from '../types';
import type { AtmosPlayer } from './types';

export const createMockPlayer = (): AtmosPlayer => {
  let track: SpotifyTrack | null = null;
  let positionMs = 0;
  let isPlaying = false;
  const stateListeners = new Set<(state: PlaybackState) => void>();
  const endedListeners = new Set<() => void>();

  const snapshot = (): PlaybackState => ({
    track,
    isPlaying,
    positionMs,
    durationMs: track?.durationMs ?? 0,
  });
  const emit = () => stateListeners.forEach((l) => l(snapshot()));

  const interval = setInterval(() => {
    if (!isPlaying || !track) return;
    positionMs += 1000;
    if (positionMs >= track.durationMs) {
      positionMs = 0;
      emit();
      endedListeners.forEach((l) => l());
    } else {
      emit();
    }
  }, 1000);

  return {
    playTrack(next) {
      track = next;
      positionMs = 0;
      isPlaying = true;
      emit();
      return Promise.resolve();
    },
    resume() {
      isPlaying = true;
      emit();
      return Promise.resolve();
    },
    pause() {
      isPlaying = false;
      emit();
      return Promise.resolve();
    },
    setVolume() {
      return Promise.resolve();
    },
    seek(ms) {
      positionMs = Math.max(0, Math.min(ms, track?.durationMs ?? 0));
      emit();
      return Promise.resolve();
    },
    subscribe(listener) {
      stateListeners.add(listener);
      listener(snapshot());
      return () => stateListeners.delete(listener);
    },
    onEnded(listener) {
      endedListeners.add(listener);
      return () => endedListeners.delete(listener);
    },
    destroy() {
      clearInterval(interval);
      stateListeners.clear();
      endedListeners.clear();
    },
  };
};
