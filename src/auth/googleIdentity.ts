/**
 * Google Identity helpers: ID-token (JWT) decoding for display-only profile
 * data, and the full-page redirect fallback used when the GIS popup is
 * blocked. The primary sign-in path is the official Sign in with Google
 * button (popup mode) rendered by @react-oauth/google on the login page.
 */
import { GOOGLE_CLIENT_ID } from './awsConfig';

export interface GoogleIdTokenClaims {
  sub: string;
  email?: string;
  name?: string;
  /** Expiry, seconds since epoch. */
  exp: number;
  nonce?: string;
}

/**
 * Decode a JWT payload WITHOUT signature verification. Fine here: the claims
 * are used only for display (name/email); authorization is enforced by
 * Cognito + IAM, which DO verify the token server-side.
 */
export const decodeGoogleIdToken = (idToken: string): GoogleIdTokenClaims => {
  const payload = idToken.split('.')[1];
  if (!payload) throw new Error('Malformed Google ID token (expected a JWT).');

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const claims = JSON.parse(new TextDecoder().decode(bytes)) as GoogleIdTokenClaims;

  if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number') {
    throw new Error('Google ID token is missing required claims (sub/exp).');
  }
  return claims;
};

/** True when the token expires within `skewMs` from now (default 60s). */
export const isGoogleIdTokenExpired = (idToken: string, skewMs = 60_000): boolean => {
  try {
    return decodeGoogleIdToken(idToken).exp * 1000 - skewMs <= Date.now();
  } catch {
    return true;
  }
};

/* -------------------------------------------------------------------------- */
/* Redirect fallback (popup blocked)                                          */
/* -------------------------------------------------------------------------- */

const STATE_KEY = 'atmos.auth.google.state';
const NONCE_KEY = 'atmos.auth.google.nonce';

export const GOOGLE_REDIRECT_CALLBACK_PATH = '/auth/google/callback';

/**
 * Full-page OpenID Connect implicit-flow redirect to Google. Returns an
 * `id_token` in the URL fragment of {@link GOOGLE_REDIRECT_CALLBACK_PATH}.
 * The redirect URI must be registered on the Google OAuth client.
 */
export const beginGoogleRedirectSignIn = (): void => {
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(NONCE_KEY, nonce);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${window.location.origin}${GOOGLE_REDIRECT_CALLBACK_PATH}`,
    response_type: 'id_token',
    scope: 'openid email profile',
    state,
    nonce,
    prompt: 'select_account',
  });
  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};

/**
 * Parse + validate the redirect callback fragment. Throws with a descriptive
 * message on any error/state/nonce problem; returns the Google ID token.
 */
export const consumeGoogleRedirectCallback = (): string => {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const expectedState = sessionStorage.getItem(STATE_KEY);
  const expectedNonce = sessionStorage.getItem(NONCE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(NONCE_KEY);

  const error = params.get('error');
  if (error) throw new Error(`Google sign-in failed: ${error}`);

  const idToken = params.get('id_token');
  if (!idToken) throw new Error('Google sign-in failed: no credential in the callback URL.');

  if (!expectedState || params.get('state') !== expectedState) {
    throw new Error('Google sign-in failed: state mismatch. Please try signing in again.');
  }
  if (!expectedNonce || decodeGoogleIdToken(idToken).nonce !== expectedNonce) {
    throw new Error('Google sign-in failed: nonce mismatch. Please try signing in again.');
  }
  return idToken;
};
