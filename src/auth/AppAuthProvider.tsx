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
import {
  clearAuthSession,
  clearAuthTokens,
  clearStoredIdToken,
  hasValidSessionIntent,
  persistIdToken,
  persistSessionIntent,
  readStoredIdToken,
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

/** Renew this many ms before the Google ID token expires. */
const RENEW_SKEW_MS = 60_000;

/** Retry silent renew this many ms after a transient failure. */
const RENEW_RETRY_MS = 5 * 60_000;

/** Consider a token "due soon" this far before expiry (focus/visibility renew). */
const FOCUS_RENEW_SKEW_MS = 5 * 60_000;

const canResumeSession = (): boolean => Boolean(readStoredIdToken()) || hasValidSessionIntent();

/**
 * Google Identity Services (GIS) → Cognito Identity Pool auth provider.
 *
 * Sign-in yields a Google ID token (via GIS/FedCM), which is exchanged with the
 * Cognito Identity Pool for the caller's Identity ID (`owner`) and the AWS
 * credentials used to talk to DynamoDB.
 *
 * Sessions slide for up to ~60 days of local "stay signed in" intent: a
 * background timer (and focus/visibility hooks) silently re-mints the ID token
 * via FedCM before it expires. That only works while the user's Google session
 * is alive and the browser allows FedCM — there is no Google refresh token in
 * this SPA path, and Terraform/Cognito session length is unchanged.
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
      persistSessionIntent(true);

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
    clearAuthSession();
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
  // silent FedCM re-auth while the local stay-signed-in intent is valid.
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
          clearStoredIdToken();
        }
      } else if (stored) {
        clearStoredIdToken();
      }

      if (hasValidSessionIntent()) {
        try {
          const idToken = await renewGoogleIdTokenSilently();
          await establishSessionRef.current(idToken);
          return;
        } catch {
          // Keep the intent so a later focus/One Tap can still recover; show
          // the login screen without treating this as a hard logout.
          clearStoredIdToken();
          setState(SIGNED_OUT);
          void promptGoogleSignIn().catch(() => {
            // Prompt is best-effort; the rendered Google button remains.
          });
          return;
        }
      }

      clearAuthSession();
      setState(SIGNED_OUT);
    })();
  }, []);

  const renewInFlightRef = useRef(false);

  const renewSessionSilently = useCallback(async (): Promise<boolean> => {
    if (!hasValidSessionIntent() || renewInFlightRef.current) return false;
    renewInFlightRef.current = true;
    try {
      const idToken = await renewGoogleIdTokenSilently();
      await establishSessionRef.current(idToken);
      return true;
    } catch {
      return false;
    } finally {
      renewInFlightRef.current = false;
    }
  }, []);

  // Sliding renewal: silently re-mint the ID token shortly before it expires.
  // Transient FedCM failures do not clear the stay-signed-in intent; we retry
  // after a short delay and again when the tab becomes visible.
  useEffect(() => {
    if (!state.isAuthenticated || !state.googleIdToken) return;

    const claims = decodeGoogleIdToken(state.googleIdToken);
    const delay = Math.max(claims.exp * 1000 - Date.now() - RENEW_SKEW_MS, 0);
    let retryTimer: number | undefined;

    const timer = window.setTimeout(() => {
      void (async () => {
        const ok = await renewSessionSilently();
        if (ok) return;

        // Token may still be valid for a bit — keep the session and retry.
        if (!isGoogleIdTokenExpired(state.googleIdToken!)) {
          retryTimer = window.setTimeout(() => {
            void renewSessionSilently();
          }, RENEW_RETRY_MS);
          return;
        }

        // Token is gone and silent renew failed. Keep intent for later resume
        // but drop the live session so DynamoDB calls stop using a dead token.
        clearStoredIdToken();
        destroyDynamoClientCache();
        if (!hasValidSessionIntent()) {
          clearAuthSession();
          setState({
            ...SIGNED_OUT,
            error: 'Your session expired. Please sign in again.',
          });
          return;
        }
        setState({
          ...SIGNED_OUT,
          error: 'Your session expired. Please sign in again.',
        });
      })();
    }, delay);

    return () => {
      clearTimeout(timer);
      if (retryTimer !== undefined) clearTimeout(retryTimer);
    };
  }, [state.isAuthenticated, state.googleIdToken, renewSessionSilently]);

  // When the tab wakes up, renew if the token is missing or near expiry.
  useEffect(() => {
    const maybeRenew = () => {
      if (document.visibilityState !== 'visible') return;
      if (!hasValidSessionIntent()) return;

      const token = readStoredIdToken();
      if (token && !isGoogleIdTokenExpired(token, FOCUS_RENEW_SKEW_MS)) return;

      void renewSessionSilently().then((ok) => {
        if (ok || state.isAuthenticated) return;
        // Signed-out but intent remains — offer One Tap quietly.
        void promptGoogleSignIn().catch(() => {});
      });
    };

    window.addEventListener('focus', maybeRenew);
    document.addEventListener('visibilitychange', maybeRenew);
    return () => {
      window.removeEventListener('focus', maybeRenew);
      document.removeEventListener('visibilitychange', maybeRenew);
    };
  }, [renewSessionSilently, state.isAuthenticated]);

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
