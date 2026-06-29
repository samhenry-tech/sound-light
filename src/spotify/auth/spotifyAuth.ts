/**
 * Spotify Authorization Code + PKCE flow.
 *
 * In mock mode the account is always considered linked and these calls are
 * no-ops, so the app is fully usable without a Spotify Premium account.
 */
import {
  IS_SPOTIFY_MOCK,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_ENDPOINTS,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_SCOPES,
} from '../config';
import { tokenResponseSchema } from '../schemas';
import { generateCodeChallenge, generateCodeVerifier, randomString } from './pkce';
import {
  clearStoredTokens,
  getStoredTokens,
  setPkceState,
  setStoredTokens,
  takePkceState,
  type SpotifyTokens,
} from './tokenStore';

/** Skew so we refresh slightly before the token actually expires. */
const EXPIRY_SKEW_MS = 60_000;

export function isSpotifyLinked(): boolean {
  if (IS_SPOTIFY_MOCK) return true;
  return getStoredTokens() !== null;
}

export async function beginSpotifyLogin(): Promise<void> {
  if (IS_SPOTIFY_MOCK) return;
  const verifier = generateCodeVerifier();
  const state = randomString(16);
  setPkceState({ verifier, state });

  const challenge = await generateCodeChallenge(verifier);
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
    scope: SPOTIFY_SCOPES.join(' '),
  });
  window.location.assign(`${SPOTIFY_ENDPOINTS.authorize}?${params.toString()}`);
}

function persist(
  parsed: ReturnType<typeof tokenResponseSchema.parse>,
  fallbackRefresh?: string,
): SpotifyTokens {
  const tokens: SpotifyTokens = {
    accessToken: parsed.access_token,
    refreshToken: parsed.refresh_token ?? fallbackRefresh,
    expiresAt: Date.now() + parsed.expires_in * 1000,
  };
  setStoredTokens(tokens);
  return tokens;
}

export async function completeSpotifyLogin(query: URLSearchParams): Promise<void> {
  if (IS_SPOTIFY_MOCK) return;

  const error = query.get('error');
  if (error) throw new Error(`Spotify authorization failed: ${error}`);

  const code = query.get('code');
  const state = query.get('state');
  const pkce = takePkceState();
  if (!code || !pkce || pkce.state !== state) {
    throw new Error('Invalid Spotify authorization response.');
  }

  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    code_verifier: pkce.verifier,
  });
  const res = await fetch(SPOTIFY_ENDPOINTS.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Spotify token exchange failed (${res.status}).`);
  persist(tokenResponseSchema.parse(await res.json()));
}

async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokens> {
  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  const res = await fetch(SPOTIFY_ENDPOINTS.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    clearStoredTokens();
    throw new Error(`Spotify token refresh failed (${res.status}).`);
  }
  return persist(tokenResponseSchema.parse(await res.json()), refreshToken);
}

/** Returns a non-expired access token, refreshing if needed, or null if unlinked. */
export async function getValidAccessToken(): Promise<string | null> {
  if (IS_SPOTIFY_MOCK) return null;
  const tokens = getStoredTokens();
  if (!tokens) return null;
  if (tokens.expiresAt - EXPIRY_SKEW_MS > Date.now()) return tokens.accessToken;
  if (!tokens.refreshToken) {
    clearStoredTokens();
    return null;
  }
  const refreshed = await refreshAccessToken(tokens.refreshToken);
  return refreshed.accessToken;
}

export function logoutSpotify(): void {
  clearStoredTokens();
}
