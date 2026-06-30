/**
 * The Spotify data API surface. Delegates to the bundled mock catalog or the
 * real Spotify Web API based on {@link IS_SPOTIFY_MOCK}, so callers never need
 * to care which is active.
 */
import { IS_SPOTIFY_MOCK } from '../config';
import { mockResolveSources, mockResolveTracks, mockSearch } from '../mock/mockApi';
import { realResolveSources, realResolveTracks, realSearch } from './realApi';

export const searchSpotify = IS_SPOTIFY_MOCK ? mockSearch : realSearch;
export const resolveSources = IS_SPOTIFY_MOCK ? mockResolveSources : realResolveSources;
export const resolveTracks = IS_SPOTIFY_MOCK ? mockResolveTracks : realResolveTracks;

export { SpotifyNotLinkedError } from './client';
