import { CognitoIdentityClient, GetIdCommand } from '@aws-sdk/client-cognito-identity';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { destroyDynamoClientCache } from '~api/dynamoClient';

import { type AuthSession, AuthSessionContext, type AuthUser } from './AuthSessionContext';
import { AWS_REGION, COGNITO_IDENTITY_POOL_ID, GOOGLE_LOGIN_PROVIDER } from './awsConfig';
import { decodeGoogleIdToken, isGoogleIdTokenExpired } from './googleIdentity';
import {
  initializeGoogleAuth,
  promptGoogleSignIn,
  renderGoogleButton as renderGisButton,
  renewGoogleIdTokenSilently,
  signOutGoogle,
} from './googleIdentityServices';
import { clearAuthTokens, persistIdToken, readStoredIdToken } from './googleTokenStore';

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

/** Renew this many ms before the Google ID token expires. */
const RENEW_SKEW_MS = 60_000;

const canResumeSession = (): boolean => Boolean(readStoredIdToken());

/**
 * Google Identity Services (GIS) → Cognito Identity Pool auth provider.
 *
 * Sign-in yields a Google ID token (via GIS/FedCM), which is exchanged with the
 * Cognito Identity Pool for the caller's Identity ID (`owner`) and the AWS
 * credentials used to talk to DynamoDB. Sessions slide: a background timer
 * silently re-mints the ID token via FedCM before it expires, so DynamoDB
 * access keeps working as long as the user's Google session is alive.
 */
export const AppAuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>(() =>
    canResumeSession() ? { ...SIGNED_OUT, isLoading: true } : SIGNED_OUT,
  );

  const establishSession = useCallback(async (idToken: string): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
    try {
      const claims = decodeGoogleIdToken(idToken);

      const cognito = new CognitoIdentityClient({ region: AWS_REGION });
      const { IdentityId } = await cognito.send(
        new GetIdCommand({
          IdentityPoolId: COGNITO_IDENTITY_POOL_ID,
          Logins: { [GOOGLE_LOGIN_PROVIDER]: idToken },
        }),
      );
      if (!IdentityId) throw new Error('Cognito did not return an identity id.');

      persistIdToken(idToken);

      setState({
        isLoading: false,
        isAuthenticated: true,
        user: {
          sub: claims.sub,
          email: claims.email,
          name: claims.name ?? claims.email,
        },
        owner: IdentityId,
        googleIdToken: idToken,
      });
    } catch (err) {
      clearAuthTokens();
      destroyDynamoClientCache();
      setState({
        ...SIGNED_OUT,
        error: err instanceof Error ? err.message : 'Sign-in failed. Please try again.',
      });
      throw err;
    }
  }, []);

  const establishSessionRef = useRef(establishSession);
  establishSessionRef.current = establishSession;

  const beginGoogleLogin = useCallback(async (): Promise<void> => {
    await promptGoogleSignIn();
  }, []);

  const renderGoogleButton = useCallback((parent: HTMLElement): void => {
    void renderGisButton(parent);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    clearAuthTokens();
    destroyDynamoClientCache();
    await signOutGoogle();
    setState(SIGNED_OUT);
  }, []);

  // Wire the GIS callback once: any credential (button, One Tap, auto-select)
  // flows straight into a Cognito session.
  useEffect(() => {
    void initializeGoogleAuth((idToken) => {
      void establishSessionRef.current(idToken).catch(() => {
        // establishSession already surfaced the error in state.
      });
    });
  }, []);

  // Resume on cold start: use a still-valid stored token, otherwise try a
  // silent FedCM re-auth before giving up.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    resumedRef.current = true;

    void (async () => {
      const stored = readStoredIdToken();
      if (stored && !isGoogleIdTokenExpired(stored)) {
        try {
          await establishSessionRef.current(stored);
          return;
        } catch {
          clearAuthTokens();
        }
      }

      try {
        const idToken = await renewGoogleIdTokenSilently();
        await establishSessionRef.current(idToken);
        return;
      } catch {
        clearAuthTokens();
        setState(SIGNED_OUT);
      }
    })();
  }, []);

  // Sliding renewal: silently re-mint the ID token shortly before it expires so
  // Cognito credentials (and DynamoDB access) keep flowing. If silent re-auth
  // is not possible, end the session so the user can sign in again.
  useEffect(() => {
    if (!state.isAuthenticated || !state.googleIdToken) return;

    const claims = decodeGoogleIdToken(state.googleIdToken);
    const delay = Math.max(claims.exp * 1000 - Date.now() - RENEW_SKEW_MS, 0);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const idToken = await renewGoogleIdTokenSilently();
          await establishSessionRef.current(idToken);
        } catch {
          clearAuthTokens();
          destroyDynamoClientCache();
          setState({
            ...SIGNED_OUT,
            error: 'Your session expired. Please sign in again.',
          });
        }
      })();
    }, delay);

    return () => clearTimeout(timer);
  }, [state.isAuthenticated, state.googleIdToken]);

  const session = useMemo<AuthSession>(
    () => ({
      ...state,
      beginGoogleLogin,
      renderGoogleButton,
      logout,
    }),
    [state, beginGoogleLogin, renderGoogleButton, logout],
  );

  return <AuthSessionContext.Provider value={session}>{children}</AuthSessionContext.Provider>;
};
