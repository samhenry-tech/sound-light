import { RouterProvider } from 'react-router-dom';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { GoogleCallbackPage } from '~components/pages/auth/GoogleCallbackPage';
import { MusicCallbackPage } from '~components/pages/auth/MusicCallbackPage';
import { LibraryPage } from '~components/pages/LibraryPage';
import { LivePage } from '~components/pages/LivePage';

import { AppProviders } from './app/AppProviders';
import { RootLayout } from './app/RootLayout';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/live" replace /> },
      { path: 'live', element: <LivePage /> },
      { path: 'library', element: <LibraryPage /> },
    ],
  },
  // Auth redirect targets live outside the gate so they can process the callback.
  { path: '/auth/google/callback', element: <GoogleCallbackPage /> },
  { path: '/auth/spotify', element: <MusicCallbackPage /> },
  { path: '/auth/spotify/', element: <MusicCallbackPage /> },
  { path: '*', element: <Navigate to="/live" replace /> },
]);

export const App = () => (
  <AppProviders>
    <RouterProvider router={router} />
  </AppProviders>
);
