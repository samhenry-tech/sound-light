/** The Spotify implementation of the app's {@link MusicProvider} interface. */
import type { MusicProvider } from '~music/types';

import { resolveSources, resolveTracks, searchSpotify } from './api/spotifyDataApi';
import {
  beginSpotifyLogin,
  completeSpotifyLogin,
  isSpotifyLinked,
  logoutSpotify,
} from './auth/spotifyAuth';
import { SPOTIFY_REDIRECT_URI } from './config';
import { createPlayer } from './playback/createPlayer';

/** Path Spotify redirects back to — derived from the registered redirect URI. */
const callbackPath = (): string => {
  try {
    return new URL(SPOTIFY_REDIRECT_URI).pathname;
  } catch {
    return '/auth/spotify/';
  }
};

export const createSpotifyMusicProvider = (): MusicProvider => {
  return {
    id: 'spotify',
    name: 'Spotify',
    capabilities: {
      playback: true,
      requiresPremium: true,
      canSeek: true,
      needsAccountLink: true,
    },
    auth: {
      isLinked: isSpotifyLinked,
      beginLogin: beginSpotifyLogin,
      completeLogin: completeSpotifyLogin,
      logout: logoutSpotify,
      callbackPath: callbackPath(),
    },
    search: searchSpotify,
    resolveSources,
    resolveTracks,
    createPlayer,
  };
};
