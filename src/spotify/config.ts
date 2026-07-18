/**
 * Spotify app configuration (app name: "sound-light", client id a35ad…).
 *
 * The client id is a public identifier; the app uses the Authorization Code
 * flow with PKCE so there is NO client secret in the browser.
 */

export const SPOTIFY_CLIENT_ID =
  import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? 'a35ad70cf30442f0a53ba22a95e85c8e';

/**
 * Redirect URI for the Spotify Authorization Code flow, derived from the
 * running client's origin so it works across environments with no config. Each
 * origin must be registered on the Spotify app and the trailing slash is
 * significant, e.g. http://localhost:3000/auth/spotify/ or
 * https://sound-light.samhenry.tech/auth/spotify/.
 */
export const SPOTIFY_REDIRECT_URI = `${window.location.origin}/auth/spotify/`;

/**
 * When mock mode is on, the Library search + playback are served by the bundled
 * catalog instead of the real Spotify Web API / Web Playback SDK (no Premium
 * account required). Default ON unless explicitly set to "false".
 */
export const IS_SPOTIFY_MOCK = (import.meta.env.VITE_SPOTIFY_MOCK ?? 'true') !== 'false';

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
