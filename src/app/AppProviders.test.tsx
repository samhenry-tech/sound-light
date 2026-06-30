import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { LivePage } from '~components/pages/LivePage';

import { AppProviders } from './AppProviders';

// LivePage has no router dependency, so it can mount under the providers alone.
// With no AWS/Spotify env, this exercises the dev session + localStorage seed +
// mock provider end to end.
describe('app integration (offline defaults)', () => {
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

    // The seeded library includes several "Tavern" mixes.
    await waitFor(() => {
      expect(screen.getAllByText('Tavern').length).toBeGreaterThan(0);
    });

    // Atmosphere filter chips render.
    expect(screen.getByRole('button', { name: 'Battle' })).toBeInTheDocument();
  });
});
