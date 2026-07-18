/**
 * Spotify app configuration (app name: "sound-light").
 *
 * The client id is a public identifier; the app uses the Authorization Code
 * flow with PKCE so there is NO client secret in the browser. Values come
 * from {@link appConfig} (`src/config.ts`).
 */

import { appConfig } from '~config';

export const SPOTIFY_CLIENT_ID = appConfig.spotifyClientId;

/**
 * Redirect URI for the Spotify Authorization Code flow, derived from the
 * running client's origin so it works across environments with no config. Each
 * origin must be registered on the Spotify app and the trailing slash is
 * significant, e.g. http://localhost:3000/auth/spotify/ or
 * https://sound-light.samhenry.tech/auth/spotify/.
 */
export const SPOTIFY_REDIRECT_URI = `${window.location.origin}/auth/spotify/`;

export const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
  'playlist-read-collaborative',
] as const;

export const SPOTIFY_ENDPOINTS = {
  authorize: 'https://accounts.spotify.com/authorize',
  token: 'https://accounts.spotify.com/api/token',
  api: 'https://api.spotify.com/v1',
} as const;
