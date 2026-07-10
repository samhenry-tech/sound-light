/** Persisted Spotify token + transient PKCE state (localStorage). */

export interface SpotifyTokens {
  accessToken: string;
  refreshToken?: string;
  /** Epoch ms at which the access token expires. */
  expiresAt: number;
}

const TOKENS_KEY = 'atmos.spotify.tokens';
const PKCE_KEY = 'atmos.spotify.pkce';

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

export interface PkceState {
  verifier: string;
  state: string;
}

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
