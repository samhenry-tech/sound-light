import type { MusicTrack } from './MusicTrack';
import type { PlaybackState } from './PlaybackState';

/** Imperative playback surface. Implemented per provider. */
export interface MusicPlayer {
  /** Start (or crossfade into) a specific track. */
  playTrack(track: MusicTrack): Promise<void>;
  resume(): Promise<void>;
  pause(): Promise<void>;
  /** Volume in the 0..1 range. */
  setVolume(volume: number): Promise<void>;
  /** Seek within the current track (ms). */
  seek(positionMs: number): Promise<void>;
  /** Subscribe to playback-state changes; returns an unsubscribe function. */
  subscribe(listener: (state: PlaybackState) => void): () => void;
  /** Fires when the current track finishes so the queue can advance. */
  onEnded(listener: () => void): () => void;
  destroy(): void;
}
