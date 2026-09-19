import type { MusicTrack } from './MusicTrack';
import type { PlaybackState } from './PlaybackState';

export type RepeatMode = 'off' | 'track' | 'context';

export interface PlayTracksOptions {
  /** Spotify Connect shuffle. Defaults to true. */
  shuffle?: boolean;
  /** Spotify Connect repeat mode. Defaults to `context` (loop the URI set). */
  repeat?: RepeatMode;
}

/** Imperative playback surface. Implemented per provider. */
export interface MusicPlayer {
  /**
   * Start a single track (legacy / hard-cut helper). Prefer {@link playTracks}
   * when starting a playlist so the provider can own shuffle + repeat.
   */
  playTrack(track: MusicTrack): Promise<void>;
  /**
   * Start playing a list of tracks as one context — Spotify receives the full
   * URI array and advances through them (with optional shuffle + repeat).
   */
  playTracks(tracks: readonly MusicTrack[], options?: PlayTracksOptions): Promise<void>;
  /** Skip to the next track in the active Spotify context. */
  skipToNext(): Promise<void>;
  /** Skip to the previous track in the active Spotify context. */
  skipToPrevious(): Promise<void>;
  resume(): Promise<void>;
  pause(): Promise<void>;
  /** Volume in the 0..1 range. */
  setVolume(volume: number): Promise<void>;
  /** Seek within the current track (ms). */
  seek(positionMs: number): Promise<void>;
  /** Subscribe to playback-state changes; returns an unsubscribe function. */
  subscribe(listener: (state: PlaybackState) => void): () => void;
  /**
   * Fires when the current track appears to have finished. With context
   * playback Spotify advances on its own — callers should not start the next
   * track from this signal.
   */
  onEnded(listener: () => void): () => void;
  destroy(): void;
}
