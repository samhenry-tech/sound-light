import { useMemo, type ReactNode } from 'react';
import { AuthProvider as OidcAuthProvider, useAuth } from 'react-oidc-context';
import { AuthSessionContext, type AuthSession } from './AuthSessionContext';
import { buildHostedUiLogoutUrl, IS_AUTH_ENABLED, oidcConfig } from './oidcConfig';

/** Fixed session used when Cognito is not configured (offline development). */
const DEV_SESSION: AuthSession = {
  enabled: false,
  isLoading: false,
  isAuthenticated: true,
  user: { sub: 'local-dev', email: 'gm@localhost', name: 'Local GM' },
  accessToken: null,
  login: () => {},
  loginWithGoogle: () => {},
  logout: () => {},
};

/** Bridges `react-oidc-context` into the app's normalized {@link AuthSession}. */
function OidcSessionBridge({ children }: { children: ReactNode }) {
  const auth = useAuth();

  const session = useMemo<AuthSession>(() => {
    const profile = auth.user?.profile;
    return {
      enabled: true,
      isLoading: auth.isLoading,
      isAuthenticated: auth.isAuthenticated,
      user: profile
        ? { sub: profile.sub, email: profile.email, name: profile.name ?? profile.email }
        : null,
      accessToken: auth.user?.access_token ?? null,
      error: auth.error?.message,
      login: () => void auth.signinRedirect(),
      loginWithGoogle: () =>
        void auth.signinRedirect({ extraQueryParams: { identity_provider: 'Google' } }),
      logout: () => {
        void auth.removeUser();
        window.location.assign(buildHostedUiLogoutUrl());
      },
    };
  }, [auth]);

  return <AuthSessionContext.Provider value={session}>{children}</AuthSessionContext.Provider>;
}

/**
 * Wraps the app in auth. With Cognito configured it mounts the OIDC provider and
 * bridges it; otherwise it provides a local dev session so the app is usable
 * without any backend.
 */
export function AppAuthProvider({ children }: { children: ReactNode }) {
  if (!IS_AUTH_ENABLED) {
    return (
      <AuthSessionContext.Provider value={DEV_SESSION}>{children}</AuthSessionContext.Provider>
    );
  }
  return (
    <OidcAuthProvider {...oidcConfig}>
      <OidcSessionBridge>{children}</OidcSessionBridge>
    </OidcAuthProvider>
  );
}
