import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import { AppAuthProvider } from '~/auth/AppAuthProvider';
import { RequiresAuth } from '~/auth/components/RequiresAuth';
import { MusicCallbackPage } from '~/components/pages/auth/MusicCallbackPage';
import { HomePage } from '~/components/pages/HomePage';
import { LibraryPage } from '~/components/pages/LibraryPage';
import { PlayerProvider } from '~/features/player/PlayerProvider';
import { MusicProviderProvider } from '~/music-providers/MusicProviderContext';

import { QueryProvider } from './app/providers/QueryProvider';
import { ThemeProvider } from './app/providers/ThemeProvider';
import { RootLayout } from './app/RootLayout';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequiresAuth>
        <RootLayout />
      </RequiresAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomePage /> },
      { path: 'library', element: <LibraryPage /> },
    ],
  },
  // Auth redirect targets live outside the gate so they can process the callback.
  { path: '/auth/spotify', element: <MusicCallbackPage /> },
  { path: '/auth/spotify/', element: <MusicCallbackPage /> },
  { path: '*', element: <Navigate to="/home" replace /> },
]);

/**
 * Composition root. Order matters: auth → query → music provider → theme
 * (reads user settings) → player (needs query + music + data).
 */
export const App = () => (
  <AppAuthProvider>
    <QueryProvider>
      <MusicProviderProvider>
        <ThemeProvider>
          <PlayerProvider>
            <RouterProvider router={router} />
          </PlayerProvider>
        </ThemeProvider>
      </MusicProviderProvider>
    </QueryProvider>
  </AppAuthProvider>
);
