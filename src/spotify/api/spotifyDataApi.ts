/**
 * The Spotify data API surface — backed by the real Spotify Web API.
 */
import { realResolveSources, realResolveTracks, realSearch } from './realApi';

export const searchSpotify = realSearch;
export const resolveSources = realResolveSources;
export const resolveTracks = realResolveTracks;

export { SpotifyNotLinkedError } from './client';
