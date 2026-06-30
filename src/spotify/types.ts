/**
 * Spotify uses the app's provider-agnostic music types directly. These aliases
 * keep the Spotify-internal code readable while guaranteeing it conforms to the
 * shared {@link MusicProvider} contract.
 */
export type {
  PlaybackState,
  ResolvedSource,
  MusicSearchResults as SpotifySearchResults,
  MusicSource as SpotifySource,
  MusicSourceKind as SpotifySourceKind,
  MusicTrack as SpotifyTrack,
} from '~music/types';
