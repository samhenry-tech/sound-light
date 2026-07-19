import type { ReactNode } from 'react';

import { AppAuthProvider } from '~auth/AppAuthProvider';
import { PlayerProvider } from '~features/player/PlayerProvider';
import { MusicProviderProvider } from '~music/MusicProviderContext';

import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from './providers/ThemeProvider';

/**
 * Composition root. Order matters: auth → query → music provider → theme
 * (reads user settings) → player (needs query + music + data).
 */
export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <AppAuthProvider>
      <QueryProvider>
        <MusicProviderProvider>
          <ThemeProvider>
            <PlayerProvider>{children}</PlayerProvider>
          </ThemeProvider>
        </MusicProviderProvider>
      </QueryProvider>
    </AppAuthProvider>
  );
};
