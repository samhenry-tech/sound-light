/**
 * Google ID-token (JWT) helpers for display-only profile data and expiry checks.
 * Authorization is enforced by Cognito + IAM, which verify the token server-side.
 */

export interface GoogleIdTokenClaims {
  sub: string;
  email?: string;
  name?: string;
  /** Opaque value bound to the sign-in request; guards against token replay. */
  nonce?: string;
  /** Expiry, seconds since epoch. */
  exp: number;
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
