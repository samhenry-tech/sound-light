import { createContext } from 'react';

export interface AuthUser {
  /** Google `sub` claim — display/identity only, NOT the data partition key. */
  sub: string;
  email?: string;
  name?: string;
}

export interface AuthSession {
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Profile decoded from the Google ID token (display only). */
  user: AuthUser | null;
  /**
   * Cognito Identity ID (e.g. "us-east-1:uuid") — the DynamoDB `owner`
   * partition key, enforced server-side by the IAM LeadingKeys condition.
   * Empty string while signed out.
   */
  owner: string;
  /** Raw Google ID token (JWT) exchanged with the Cognito Identity Pool. */
  googleIdToken: string | null;
  error?: string;
  /**
   * Complete sign-in from a Google ID token — used by both the GIS popup
   * button (onSuccess credential) and the redirect callback page.
   */
  loginWithGoogleCredential: (credential: string) => Promise<void>;
  /** Full-page redirect fallback for browsers that block the GIS popup. */
  loginWithGoogleRedirect: () => void;
  logout: () => void;
}

export const AuthSessionContext = createContext<AuthSession | null>(null);
