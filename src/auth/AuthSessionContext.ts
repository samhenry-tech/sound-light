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
  /** Trigger the Google One Tap / FedCM sign-in prompt. */
  beginGoogleLogin: () => Promise<void>;
  /** Render the official Google sign-in button into the given element. */
  renderGoogleButton: (parent: HTMLElement) => void;
  logout: () => Promise<void>;
}

export const AuthSessionContext = createContext<AuthSession | null>(null);
