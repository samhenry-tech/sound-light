import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuthSession } from '~auth/useAuthSession';

import { Splash } from './Splash';

/**
 * OAuth callback for Google sign-in. Exchanges the `?code=` query for tokens,
 * establishes the Cognito session, then returns to the app.
 */
export const GoogleCallbackPage = () => {
  const { loginWithGoogleCode, isAuthenticated, error } = useAuthSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [callbackError, setCallbackError] = useState<string>();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    loginWithGoogleCode(searchParams).catch((err: unknown) => {
      setCallbackError(err instanceof Error ? err.message : 'Sign-in failed.');
    });
  }, [loginWithGoogleCode, searchParams]);

  useEffect(() => {
    if (isAuthenticated) void navigate('/live', { replace: true });
  }, [isAuthenticated, navigate]);

  return <Splash title="Signing you in…" error={callbackError ?? error} />;
};
