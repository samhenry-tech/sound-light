import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import { RequiresAuth } from '~auth/components/RequiresAuth';
import { MusicCallbackPage } from '~components/pages/auth/MusicCallbackPage';
import { HomePage } from '~components/pages/HomePage';
import { LibraryPage } from '~components/pages/LibraryPage';

import { AppProviders } from './app/AppProviders';
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

export const App = () => (
  <AppProviders>
    <RouterProvider router={router} />
  </AppProviders>
);
