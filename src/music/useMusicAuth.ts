import { useCallback, useState } from 'react';

import { useMusicProvider } from './MusicProviderContext';

/** React surface over the active provider's account-link state + actions. */
export const useMusicAuth = () => {
  const provider = useMusicProvider();
  const [linked, setLinked] = useState(() => provider.auth.isLinked());

  const login = useCallback(() => {
    void provider.auth.beginLogin();
  }, [provider]);

  const logout = useCallback(() => {
    provider.auth.logout();
    setLinked(false);
  }, [provider]);

  const refresh = useCallback(() => setLinked(provider.auth.isLinked()), [provider]);

  return {
    providerId: provider.id,
    providerName: provider.name,
    capabilities: provider.capabilities,
    callbackPath: provider.auth.callbackPath,
    linked,
    login,
    logout,
    refresh,
  };
};
