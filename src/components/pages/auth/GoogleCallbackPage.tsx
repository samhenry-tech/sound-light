import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { consumeGoogleRedirectCallback } from '~auth/googleIdentity';
import { useAuthSession } from '~auth/useAuthSession';

import { Splash } from './Splash';

/**
 * Redirect target for the Google sign-in fallback flow. Google returns an
 * `id_token` in the URL fragment; this page validates it (state/nonce) and
 * hands it to the auth provider, then bounces back into the app.
 */
export const GoogleCallbackPage = () => {
  const { loginWithGoogleCredential, isAuthenticated, error } = useAuthSession();
  const navigate = useNavigate();
  const [callbackError, setCallbackError] = useState<string>();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      const idToken = consumeGoogleRedirectCallback();
      // Drop the token-bearing fragment from the address bar / history.
      window.history.replaceState({}, document.title, window.location.pathname);
      loginWithGoogleCredential(idToken).catch((err: unknown) => {
        setCallbackError(err instanceof Error ? err.message : 'Sign-in failed.');
      });
    } catch (err) {
      setCallbackError(err instanceof Error ? err.message : 'Sign-in failed.');
    }
  }, [loginWithGoogleCredential]);

  useEffect(() => {
    if (isAuthenticated) void navigate('/live', { replace: true });
  }, [isAuthenticated, navigate]);

  return <Splash title="Signing you in…" error={callbackError ?? error} />;
};
