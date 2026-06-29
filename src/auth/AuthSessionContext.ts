import { createContext } from 'react';

export interface AuthUser {
  /** Cognito `sub` — the stable per-user id used to scope data ownership. */
  sub: string;
  email?: string;
  name?: string;
}

export interface AuthSession {
  /** False when running with the local dev session (auth env not configured). */
  enabled: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  /** Cognito access token (JWT) for the data API, or null in dev mode. */
  accessToken: string | null;
  error?: string;
  /** Open the Cognito Hosted UI (lists Google + email). */
  login: () => void;
  /** Jump straight to Google federated sign-in. */
  loginWithGoogle: () => void;
  logout: () => void;
}

export const AuthSessionContext = createContext<AuthSession | null>(null);
