/** localStorage bootstrap for the Google ID token (cold-start session resume). */
import { APP_NAME } from '~constants';

const ID_TOKEN_KEY = `${APP_NAME}.auth.googleIdToken`;

export const readStoredIdToken = (): string | null => localStorage.getItem(ID_TOKEN_KEY);

export const persistIdToken = (idToken: string): void => {
  localStorage.setItem(ID_TOKEN_KEY, idToken);
};

export const clearAuthTokens = (): void => {
  localStorage.removeItem(ID_TOKEN_KEY);
};
