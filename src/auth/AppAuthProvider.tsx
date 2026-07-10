import { CognitoIdentityClient, GetIdCommand } from '@aws-sdk/client-cognito-identity';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type AuthSession, AuthSessionContext, type AuthUser } from './AuthSessionContext';
import {
  AWS_REGION,
  COGNITO_IDENTITY_POOL_ID,
  GOOGLE_CLIENT_ID,
  GOOGLE_LOGIN_PROVIDER,
} from './awsConfig';
import {
  beginGoogleRedirectSignIn,
  decodeGoogleIdToken,
  isGoogleIdTokenExpired,
} from './googleIdentity';

/** Where the Google ID token survives reloads. Cleared on logout/expiry. */
const TOKEN_STORAGE_KEY = 'atmos.auth.googleIdToken';

/** GIS global injected by the Sign in with Google script (may be absent). */
declare global {
  interface Window {
    google?: {
      accounts?: { id?: { disableAutoSelect?: () => void } };
    };
  }
}

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  owner: string;
  googleIdToken: string | null;
  error?: string;
}

const SIGNED_OUT: AuthState = {
  isLoading: false,
  isAuthenticated: false,
  user: null,
  owner: '',
  googleIdToken: null,
};

const readStoredToken = (): string | null => {
  const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) return null;
  if (isGoogleIdTokenExpired(token)) {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
  return token;
};

/**
 * Google Sign-In → Cognito Identity Pool auth provider.
 *
 * On a successful Google credential (popup button or redirect callback) it:
 *  1. decodes the ID token for display-only profile data (sub/email/name),
 *  2. resolves the caller's Cognito Identity ID (`owner` — the DynamoDB
 *     partition key the IAM policy enforces via LeadingKeys),
 *  3. keeps the raw ID token around for the DynamoDB client's credential
 *     provider (see src/api/dynamoClient.ts).
 */
export const AppAuthProvider = ({ children }: { children: ReactNode }) => {
  // Start in a loading state when a resumable token exists so the auth gate
  // shows the splash instead of flashing the login page.
  const [state, setState] = useState<AuthState>(() =>
    readStoredToken() ? { ...SIGNED_OUT, isLoading: true } : SIGNED_OUT,
  );

  const loginWithGoogleCredential = useCallback(async (credential: string): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
    try {
      const claims = decodeGoogleIdToken(credential);

      // Exchange the Google ID token for this user's stable Cognito identity.
      const cognito = new CognitoIdentityClient({ region: AWS_REGION });
      const { IdentityId } = await cognito.send(
        new GetIdCommand({
          IdentityPoolId: COGNITO_IDENTITY_POOL_ID,
          Logins: { [GOOGLE_LOGIN_PROVIDER]: credential },
        }),
      );
      if (!IdentityId) throw new Error('Cognito did not return an identity id.');

      sessionStorage.setItem(TOKEN_STORAGE_KEY, credential);
      setState({
        isLoading: false,
        isAuthenticated: true,
        user: { sub: claims.sub, email: claims.email, name: claims.name ?? claims.email },
        owner: IdentityId,
        googleIdToken: credential,
      });
    } catch (err) {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      setState({
        ...SIGNED_OUT,
        error: err instanceof Error ? err.message : 'Sign-in failed. Please try again.',
      });
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    window.google?.accounts?.id?.disableAutoSelect?.();
    setState(SIGNED_OUT);
  }, []);

  // Resume a still-valid session after a reload.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    resumedRef.current = true;
    const stored = readStoredToken();
    if (stored) void loginWithGoogleCredential(stored);
  }, [loginWithGoogleCredential]);

  const session = useMemo<AuthSession>(
    () => ({
      ...state,
      loginWithGoogleCredential,
      loginWithGoogleRedirect: beginGoogleRedirectSignIn,
      logout,
    }),
    [state, loginWithGoogleCredential, logout],
  );

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthSessionContext.Provider value={session}>{children}</AuthSessionContext.Provider>
    </GoogleOAuthProvider>
  );
};
