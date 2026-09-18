/** Persisted Spotify token + transient PKCE state (localStorage). */
import { APP_NAME } from '~/constants';

import type { PkceState } from '../models/PkceState';
import type { SpotifyTokens } from '../models/SpotifyTokens';

export type { PkceState, SpotifyTokens };

const TOKENS_KEY = `${APP_NAME}.spotify.tokens`;
const PKCE_KEY = `${APP_NAME}.spotify.pkce`;

export const getStoredTokens = (): SpotifyTokens | null => {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as SpotifyTokens) : null;
  } catch {
    return null;
  }
};

export const setStoredTokens = (tokens: SpotifyTokens): void => {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
};

export const clearStoredTokens = (): void => {
  localStorage.removeItem(TOKENS_KEY);
};

export const setPkceState = (state: PkceState): void => {
  sessionStorage.setItem(PKCE_KEY, JSON.stringify(state));
};

export const takePkceState = (): PkceState | null => {
  try {
    const raw = sessionStorage.getItem(PKCE_KEY);
    sessionStorage.removeItem(PKCE_KEY);
    return raw ? (JSON.parse(raw) as PkceState) : null;
  } catch {
    return null;
  }
};
