import type { ReactNode } from 'react';
import { AppAuthProvider } from '@/auth';
import { MusicProviderProvider } from '@/music';
import { AmbientController } from '@/features/ambient';
import { PlayerProvider } from '@/features/player';
import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from './providers/ThemeProvider';

/**
 * Composition root. Order matters: auth → query → music provider → theme
 * (reads prefs) → player (needs query + music + data).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppAuthProvider>
      <QueryProvider>
        <MusicProviderProvider>
          <ThemeProvider>
            <PlayerProvider>
              <AmbientController />
              {children}
            </PlayerProvider>
          </ThemeProvider>
        </MusicProviderProvider>
      </QueryProvider>
    </AppAuthProvider>
  );
}
