import type { MusicTrack } from './MusicTrack';

export type MusicSourceKind = 'playlist' | 'album' | 'collection';

/** A playlist/album/collection added as a locked unit. */
export interface MusicSource {
  id: string;
  uri: string;
  kind: MusicSourceKind;
  name: string;
  owner: string;
  trackCount: number;
  artworkUrl?: string;
}

export interface ResolvedSource extends MusicSource {
  tracks: MusicTrack[];
}
