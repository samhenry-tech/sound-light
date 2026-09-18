/** A single track. `uri` is the provider's canonical identity. */
export interface MusicTrack {
  id: string;
  uri: string;
  title: string;
  artist: string;
  durationMs: number;
  artworkUrl?: string;
}
