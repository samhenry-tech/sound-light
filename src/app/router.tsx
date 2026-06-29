import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LivePage } from '@/pages/LivePage';
import { LibraryPage } from '@/pages/LibraryPage';
import { CognitoCallbackPage } from '@/pages/auth/CognitoCallbackPage';
import { MusicCallbackPage } from '@/pages/auth/MusicCallbackPage';
import { RootLayout } from './RootLayout';

export const router = createBrowserRouter([
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
  { path: '/auth/callback', element: <CognitoCallbackPage /> },
  { path: '/auth/spotify', element: <MusicCallbackPage /> },
  { path: '/auth/spotify/', element: <MusicCallbackPage /> },
  { path: '*', element: <Navigate to="/live" replace /> },
]);
