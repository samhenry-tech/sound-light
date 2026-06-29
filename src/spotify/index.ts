/**
 * Public surface of the Spotify integration. The app consumes Spotify only as a
 * {@link MusicProvider} via {@link createSpotifyMusicProvider}; everything else
 * here is for wiring (the OAuth callback) or building the offline seed library.
 */
export { createSpotifyMusicProvider } from './provider';
export { IS_SPOTIFY_MOCK, SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI } from './config';

// Mock catalog helpers — used to build the offline seed library.
export {
  MOCK_SOURCE_URIS_BY_ATMOSPHERE,
  mockSourceUri,
  mockTrackUri,
} from './mock/catalog';
