/**
 * localStorage bootstrap for Google auth cold-start resume.
 *
 * The Google ID token itself is short-lived (~1h). What keeps users "signed in"
 * for weeks is a local *session intent* plus silent FedCM renewal while their
 * Google account session is still alive. This is not a server session and cannot
 * outlive Google/browser policy — but it avoids forcing a fresh click every hour.
 */
import { APP_NAME } from '~constants';

const ID_TOKEN_KEY = `${APP_NAME}.auth.googleIdToken`;
const SESSION_INTENT_KEY = `${APP_NAME}.auth.sessionIntent`;

/** How long we keep trying to silently re-auth after the last successful sign-in. */
export const SESSION_INTENT_TTL_MS = 60 * 24 * 60 * 60 * 1000; // ~60 days

interface StoredSessionIntent {
  remember: boolean;
  createdAt: number;
  expiresAt: number;
}

export const readStoredIdToken = (): string | null => localStorage.getItem(ID_TOKEN_KEY);

export const persistIdToken = (idToken: string): void => {
  localStorage.setItem(ID_TOKEN_KEY, idToken);
};

export const clearStoredIdToken = (): void => {
  localStorage.removeItem(ID_TOKEN_KEY);
};

export const persistSessionIntent = (remember = true): void => {
  const now = Date.now();
  const intent: StoredSessionIntent = {
    remember,
    createdAt: now,
    expiresAt: now + SESSION_INTENT_TTL_MS,
  };
  localStorage.setItem(SESSION_INTENT_KEY, JSON.stringify(intent));
};

export const hasValidSessionIntent = (): boolean => {
  const raw = localStorage.getItem(SESSION_INTENT_KEY);
  if (!raw) return false;
  try {
    const intent = JSON.parse(raw) as StoredSessionIntent;
    return (
      intent.remember === true &&
      typeof intent.expiresAt === 'number' &&
      intent.expiresAt > Date.now()
    );
  } catch {
    return false;
  }
};

export const clearSessionIntent = (): void => {
  localStorage.removeItem(SESSION_INTENT_KEY);
};

/** Drop only the short-lived ID token (keep session intent for silent resume). */
export const clearAuthTokens = (): void => {
  clearStoredIdToken();
};

/** Explicit logout / abandoned intent — clear token and remember-me state. */
export const clearAuthSession = (): void => {
  clearStoredIdToken();
  clearSessionIntent();
};
