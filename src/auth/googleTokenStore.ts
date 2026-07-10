/** localStorage keys for Google auth tokens (bootstrap for cold-start silent refresh). */

const ID_TOKEN_KEY = 'atmos.auth.googleIdToken';
const REFRESH_TOKEN_KEY = 'atmos.auth.googleRefreshToken';

export const readStoredIdToken = (): string | null => localStorage.getItem(ID_TOKEN_KEY);

export const readStoredRefreshToken = (): string | null =>
  localStorage.getItem(REFRESH_TOKEN_KEY);

export const persistAuthTokens = (idToken: string, refreshToken?: string): void => {
  localStorage.setItem(ID_TOKEN_KEY, idToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const clearAuthTokens = (): void => {
  localStorage.removeItem(ID_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};
