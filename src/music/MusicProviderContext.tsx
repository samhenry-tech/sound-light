import { createContext, type ReactNode, useContext, useMemo } from 'react';

import { createActiveMusicProvider } from './registry';
import type { MusicProvider } from './types';

const MusicProviderContext = createContext<MusicProvider | null>(null);

/**
 * Provides the active {@link MusicProvider} to the tree. Pass an explicit
 * `provider` in tests to inject a fake backend.
 */
export const MusicProviderProvider = ({
  children,
  provider,
}: {
  children: ReactNode;
  provider?: MusicProvider;
}) => {
  const value = useMemo(() => provider ?? createActiveMusicProvider(), [provider]);
  return <MusicProviderContext.Provider value={value}>{children}</MusicProviderContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMusicProvider = (): MusicProvider => {
  const ctx = useContext(MusicProviderContext);
  if (!ctx) throw new Error('useMusicProvider must be used within <MusicProviderProvider>');
  return ctx;
};
