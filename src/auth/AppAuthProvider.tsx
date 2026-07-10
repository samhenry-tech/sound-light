import { CognitoIdentityClient, GetIdCommand } from '@aws-sdk/client-cognito-identity';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  clearGoogleRefreshToken,
  loadGoogleRefreshToken,
  persistGoogleRefreshToken,
} from '~api/authSettings';
import { destroyDynamoClientCache } from '~api/dynamoClient';

import { type AuthSession, AuthSessionContext, type AuthUser } from './AuthSessionContext';
import {
  AWS_REGION,
  COGNITO_IDENTITY_POOL_ID,
  GOOGLE_LOGIN_PROVIDER,
} from './awsConfig';
import { decodeGoogleIdToken, isGoogleIdTokenExpired } from './googleIdentity';
import {
  beginGoogleLogin,
  completeGoogleLogin,
  refreshGoogleTokens,
  revokeGoogleToken,
} from './googleOAuth';
import {
  clearAuthTokens,
  persistAuthTokens,
  readStoredIdToken,
  readStoredRefreshToken,
} from './googleTokenStore';

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

const canResumeSession = (): boolean =>
  Boolean(readStoredIdToken()) || Boolean(readStoredRefreshToken());

/**
 * Google OAuth (code + PKCE) → Cognito Identity Pool auth provider.
 *
 * On sign-in it resolves the caller's Cognito Identity ID (`owner`), keeps the
 * Google ID token for DynamoDB credentials, and persists the refresh token to
 * localStorage (cold-start bootstrap) and DynamoDB user-settings (cross-device).
 */
export const AppAuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>(() =>
    canResumeSession() ? { ...SIGNED_OUT, isLoading: true } : SIGNED_OUT,
  );

  const stateRef = useRef(state);
  stateRef.current = state;

  const establishSession = useCallback(
    async (tokens: { idToken: string; refreshToken?: string }): Promise<void> => {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
      try {
        const claims = decodeGoogleIdToken(tokens.idToken);

        const cognito = new CognitoIdentityClient({ region: AWS_REGION });
        const { IdentityId } = await cognito.send(
          new GetIdCommand({
            IdentityPoolId: COGNITO_IDENTITY_POOL_ID,
            Logins: { [GOOGLE_LOGIN_PROVIDER]: tokens.idToken },
          }),
        );
        if (!IdentityId) throw new Error('Cognito did not return an identity id.');

        const ctx = { owner: IdentityId, googleIdToken: tokens.idToken };

        let refreshToken = tokens.refreshToken ?? readStoredRefreshToken() ?? undefined;
        if (!refreshToken) {
          try {
            refreshToken = await loadGoogleRefreshToken(ctx);
          } catch {
            // First login or offline — proceed without a refresh token.
          }
        }

        if (refreshToken) {
          persistAuthTokens(tokens.idToken, refreshToken);
          try {
            await persistGoogleRefreshToken(ctx, refreshToken);
          } catch {
            // Non-fatal: localStorage still enables silent refresh on this device.
          }
        } else {
          persistAuthTokens(tokens.idToken);
        }

        setState({
          isLoading: false,
          isAuthenticated: true,
          user: {
            sub: claims.sub,
            email: claims.email,
            name: claims.name ?? claims.email,
          },
          owner: IdentityId,
          googleIdToken: tokens.idToken,
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
    },
    [],
  );

  const establishSessionRef = useRef(establishSession);
  establishSessionRef.current = establishSession;

  const loginWithGoogleCode = useCallback(
    async (query: URLSearchParams): Promise<void> => {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
      try {
        const oauth = await completeGoogleLogin(query);
        await establishSession({
          idToken: oauth.idToken,
          refreshToken: oauth.refreshToken,
        });
      } catch (err) {
        clearAuthTokens();
        setState({
          ...SIGNED_OUT,
          error: err instanceof Error ? err.message : 'Sign-in failed. Please try again.',
        });
        throw err;
      }
    },
    [establishSession],
  );

  const logout = useCallback(async (): Promise<void> => {
    const { owner, googleIdToken } = stateRef.current;
    const refreshToken = readStoredRefreshToken();

    clearAuthTokens();
    destroyDynamoClientCache();

    if (refreshToken) {
      void revokeGoogleToken(refreshToken).catch(() => {});
    }

    if (owner && googleIdToken) {
      try {
        await clearGoogleRefreshToken({ owner, googleIdToken });
      } catch {
        // Offline logout still clears this device.
      }
    }

    setState(SIGNED_OUT);
  }, []);

  // Resume from localStorage on cold start (valid id_token or refresh_token).
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    resumedRef.current = true;

    void (async () => {
      const idToken = readStoredIdToken();
      if (idToken && !isGoogleIdTokenExpired(idToken)) {
        try {
          await establishSessionRef.current({
            idToken,
            refreshToken: readStoredRefreshToken() ?? undefined,
          });
          return;
        } catch {
          clearAuthTokens();
        }
      }

      const refreshToken = readStoredRefreshToken();
      if (refreshToken) {
        try {
          const refreshed = await refreshGoogleTokens(refreshToken);
          await establishSessionRef.current({
            idToken: refreshed.idToken,
            refreshToken: refreshed.refreshToken,
          });
          return;
        } catch {
          clearAuthTokens();
        }
      }

      setState(SIGNED_OUT);
    })();
  }, []);

  // Background refresh before the ID token expires (~1h).
  useEffect(() => {
    if (!state.isAuthenticated || !state.googleIdToken) return;

    const claims = decodeGoogleIdToken(state.googleIdToken);
    const delay = Math.max(claims.exp * 1000 - Date.now() - 60_000, 0);

    const timer = window.setTimeout(() => {
      void (async () => {
        const refreshToken = readStoredRefreshToken();
        if (!refreshToken) return;
        try {
          const refreshed = await refreshGoogleTokens(refreshToken);
          await establishSessionRef.current({
            idToken: refreshed.idToken,
            refreshToken: refreshed.refreshToken,
          });
        } catch {
          clearAuthTokens();
          destroyDynamoClientCache();
          setState(SIGNED_OUT);
        }
      })();
    }, delay);

    return () => clearTimeout(timer);
  }, [state.isAuthenticated, state.googleIdToken]);

  const session = useMemo<AuthSession>(
    () => ({
      ...state,
      beginGoogleLogin,
      loginWithGoogleCode,
      logout,
    }),
    [state, loginWithGoogleCode, logout],
  );

  return (
    <AuthSessionContext.Provider value={session}>{children}</AuthSessionContext.Provider>
  );
};
