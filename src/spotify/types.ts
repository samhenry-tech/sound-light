/**
 * Spotify uses the app's provider-agnostic music types directly. These aliases
 * keep the Spotify-internal code readable while guaranteeing it conforms to the
 * shared {@link MusicProvider} contract.
 */
export type {
  MusicTrack as SpotifyTrack,
  MusicSource as SpotifySource,
  MusicSourceKind as SpotifySourceKind,
  ResolvedSource,
  MusicSearchResults as SpotifySearchResults,
  PlaybackState,
} from '@/music/types';
