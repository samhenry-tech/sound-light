import { useContext } from 'react';

import { type AuthSession, AuthSessionContext } from './AuthSessionContext';

/** Access the current auth session. Throws if used outside the provider. */
export const useAuthSession = (): AuthSession => {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) throw new Error('useAuthSession must be used within <AppAuthProvider>');
  return ctx;
};
