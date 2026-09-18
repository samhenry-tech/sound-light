import type { MusicTrack } from './MusicTrack';

export interface PlaybackState {
  track: MusicTrack | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
}
