/**
 * Google OAuth Authorization Code + PKCE flow.
 *
 * Issues a refresh token (with `access_type=offline`) so sessions can be
 * renewed silently without another interactive sign-in.
 */
import { z } from 'zod';

import { GOOGLE_CLIENT_ID } from './awsConfig';
import { readStoredRefreshToken } from './googleTokenStore';
import { generateCodeChallenge, generateCodeVerifier, randomString } from './pkce';

export const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
export const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';
export const GOOGLE_REDIRECT_CALLBACK_PATH = '/auth/google/callback';

const PKCE_STATE_KEY = 'atmos.auth.google.pkce';

const tokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  id_token: z.string(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
  token_type: z.string(),
});

export interface GoogleOAuthTokens {
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export const getGoogleRedirectUri = (): string =>
  `${window.location.origin}${GOOGLE_REDIRECT_CALLBACK_PATH}`;

const exchangeCodeForTokens = async (
  code: string,
  verifier: string,
): Promise<GoogleOAuthTokens> => {
  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: getGoogleRedirectUri(),
    code_verifier: verifier,
  });
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed (${res.status}).`);
  }
  const parsed = tokenResponseSchema.parse(await res.json());
  return {
    idToken: parsed.id_token,
    refreshToken: parsed.refresh_token,
    expiresIn: parsed.expires_in,
  };
};

/**
 * Redirect to Google for sign-in. Requests `offline` access so a refresh token
 * is issued on first consent; re-login without consent reuses the stored token.
 */
export const beginGoogleLogin = async (): Promise<void> => {
  const verifier = generateCodeVerifier();
  const state = randomString(16);
  sessionStorage.setItem(PKCE_STATE_KEY, JSON.stringify({ verifier, state }));

  const challenge = await generateCodeChallenge(verifier);
  const needsConsent = !readStoredRefreshToken();
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: getGoogleRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: needsConsent ? 'consent select_account' : 'select_account',
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  });
  window.location.assign(`${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`);
};

/** Exchange the authorization `code` from the callback query for tokens. */
export const completeGoogleLogin = async (query: URLSearchParams): Promise<GoogleOAuthTokens> => {
  const error = query.get('error');
  if (error) throw new Error(`Google sign-in failed: ${error}`);

  const code = query.get('code');
  const returnedState = query.get('state');
  const stored = sessionStorage.getItem(PKCE_STATE_KEY);
  sessionStorage.removeItem(PKCE_STATE_KEY);

  if (!code || !stored) {
    throw new Error('Invalid Google authorization response.');
  }

  const pkce = JSON.parse(stored) as { verifier: string; state: string };
  if (pkce.state !== returnedState) {
    throw new Error('Google sign-in failed: state mismatch. Please try signing in again.');
  }

  return exchangeCodeForTokens(code, pkce.verifier);
};

/** Refresh an expired ID token using a stored refresh token. */
export const refreshGoogleTokens = async (refreshToken: string): Promise<GoogleOAuthTokens> => {
  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed (${res.status}).`);
  }
  const parsed = tokenResponseSchema.parse(await res.json());
  return {
    idToken: parsed.id_token,
    refreshToken: parsed.refresh_token ?? refreshToken,
    expiresIn: parsed.expires_in,
  };
};

/** Revoke a refresh or access token on logout (best-effort). */
export const revokeGoogleToken = async (token: string): Promise<void> => {
  await fetch(`${GOOGLE_REVOKE_ENDPOINT}?token=${encodeURIComponent(token)}`, {
    method: 'POST',
  });
};
