/**
 * Cognito (OIDC) configuration for `react-oidc-context`.
 *
 * Uses the Authorization Code + PKCE flow against the Cognito user pool, with
 * Google federation handled by the Cognito Hosted UI. When the Cognito env vars
 * are absent, {@link IS_AUTH_ENABLED} is false and the app runs with a local dev
 * session instead (no sign-in required for offline development).
 */
import { WebStorageStateStore } from 'oidc-client-ts';
import type { AuthProviderProps } from 'react-oidc-context';

const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export const COGNITO_AUTHORITY = import.meta.env.VITE_COGNITO_AUTHORITY ?? '';
export const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID ?? '';
export const COGNITO_HOSTED_UI = import.meta.env.VITE_COGNITO_HOSTED_UI ?? '';
export const COGNITO_REDIRECT_URI =
  import.meta.env.VITE_COGNITO_REDIRECT_URI ?? `${origin}/auth/callback`;
export const COGNITO_LOGOUT_URI = import.meta.env.VITE_COGNITO_LOGOUT_URI ?? origin;

export const IS_AUTH_ENABLED = Boolean(COGNITO_AUTHORITY && COGNITO_CLIENT_ID);

export const oidcConfig: AuthProviderProps = {
  authority: COGNITO_AUTHORITY,
  client_id: COGNITO_CLIENT_ID,
  redirect_uri: COGNITO_REDIRECT_URI,
  post_logout_redirect_uri: COGNITO_LOGOUT_URI,
  response_type: 'code',
  scope: 'openid email profile',
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  // Strip the ?code&state from the URL once the redirect has been processed.
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, '/');
  },
};

/** Cognito Hosted UI logout endpoint (clears the federated session too). */
export function buildHostedUiLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: COGNITO_CLIENT_ID,
    logout_uri: COGNITO_LOGOUT_URI,
  });
  return `${COGNITO_HOSTED_UI}/logout?${params.toString()}`;
}
