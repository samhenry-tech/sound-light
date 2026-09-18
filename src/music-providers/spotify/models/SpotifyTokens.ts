/** Persisted Spotify OAuth tokens. */
export interface SpotifyTokens {
  accessToken: string;
  refreshToken?: string;
  /** Epoch ms at which the access token expires. */
  expiresAt: number;
}
