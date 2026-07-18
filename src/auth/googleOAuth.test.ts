import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { APP_NAME } from '~constants';

import { completeGoogleLogin, refreshGoogleTokens } from './googleOAuth';
import { readStoredRefreshToken } from './googleTokenStore';

vi.mock('./awsConfig', () => ({
  GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
}));

describe('googleOAuth', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exchanges an authorization code for tokens', async () => {
    sessionStorage.setItem(
      `${APP_NAME}.auth.google.pkce`,
      JSON.stringify({ verifier: 'test-verifier', state: 'expected-state' }),
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'access',
        expires_in: 3600,
        id_token: 'header.payload.signature',
        refresh_token: 'refresh-abc',
        token_type: 'Bearer',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const tokens = await completeGoogleLogin(
      new URLSearchParams({ code: 'auth-code', state: 'expected-state' }),
    );

    expect(tokens.idToken).toBe('header.payload.signature');
    expect(tokens.refreshToken).toBe('refresh-abc');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('refreshes an expired session using a stored refresh token', async () => {
    localStorage.setItem(`${APP_NAME}.auth.googleRefreshToken`, 'stored-refresh');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new-access',
        expires_in: 3600,
        id_token: 'new-id-token',
        token_type: 'Bearer',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const tokens = await refreshGoogleTokens('stored-refresh');

    expect(tokens.idToken).toBe('new-id-token');
    expect(tokens.refreshToken).toBe('stored-refresh');
    expect(readStoredRefreshToken()).toBe('stored-refresh');
  });

  it('rejects callbacks with a state mismatch', async () => {
    sessionStorage.setItem(
      `${APP_NAME}.auth.google.pkce`,
      JSON.stringify({ verifier: 'v', state: 'expected' }),
    );

    await expect(
      completeGoogleLogin(new URLSearchParams({ code: 'c', state: 'wrong' })),
    ).rejects.toThrow(/state mismatch/i);
  });
});
