import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LivePage } from '~components/pages/LivePage';

import { AppProviders } from './AppProviders';

// Auth always requires Google + Cognito now, so the provider is replaced with
// a pre-authenticated session; the DynamoDB adapter is swapped for the
// localStorage adapter (which seeds the starter library). Everything else —
// query client, theme, player, mock music provider — runs for real.
vi.mock('~auth/AppAuthProvider', async () => {
  const { AuthSessionContext } = await import('~auth/AuthSessionContext');
  const session = {
    isLoading: false,
    isAuthenticated: true,
    user: { sub: 'google-sub-123', email: 'gm@example.com', name: 'Test GM' },
    owner: 'us-east-1:00000000-0000-0000-0000-000000000000',
    googleIdToken: 'test-google-id-token',
    beginGoogleLogin: async () => {},
    renderGoogleButton: () => {},
    logout: async () => {},
  };
  return {
    AppAuthProvider: ({ children }: { children: ReactNode }) => (
      <AuthSessionContext.Provider value={session}>{children}</AuthSessionContext.Provider>
    ),
  };
});

vi.mock('~api/dataAdapter', async () => {
  const { localAdapter } = await import('~api/adapters/localAdapter');
  return { dataAdapter: localAdapter };
});

describe('app integration (mocked auth + local data adapter)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the Live screen with the seeded starter library', async () => {
    render(
      <AppProviders>
        <LivePage />
      </AppProviders>,
    );

    // Header search is present immediately.
    expect(screen.getByPlaceholderText(/search a location or vibe/i)).toBeInTheDocument();

    // The seeded library includes several "Tavern" playlists.
    await waitFor(() => {
      expect(screen.getAllByText('Tavern').length).toBeGreaterThan(0);
    });

    // Atmosphere filter chips render.
    expect(screen.getByRole('button', { name: 'Battle' })).toBeInTheDocument();
  });
});
