import type { MusicSource } from './MusicSource';
import type { MusicTrack } from './MusicTrack';

/** Search results — individual tracks and whole sources. */
export interface MusicSearchResults {
  tracks: MusicTrack[];
  sources: MusicSource[];
}
