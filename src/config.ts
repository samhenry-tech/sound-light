/**
 * Public client configuration assembled from:
 * - `config/shared.json` — inputs Terraform and the SPA both read
 * - `src/config.generated.json` — Terraform outputs (refreshed on apply)
 *
 * Nothing secret belongs here; these values ship in the SPA bundle.
 * OAuth redirect URIs are derived from the browser origin at runtime.
 */

import shared from '../config/shared.json' with { type: 'json' };
import generated from './config.generated.json' with { type: 'json' };

export type MusicProviderId = 'spotify';

export const appConfig = {
  /** Google OAuth 2.0 Web-application client ID (Sign in with Google). */
  googleClientId: shared.googleClientId,

  /** Cognito Identity Pool id (from Terraform output). */
  cognitoIdentityPoolId: generated.cognitoIdentityPoolId,

  /** AWS region hosting the identity pool + DynamoDB tables. */
  awsRegion: generated.awsRegion,

  playlistsTable: generated.playlistsTable,
  settingsTable: generated.settingsTable,

  /** The identity pool login-provider key for Google ID tokens. */
  googleLoginProvider: shared.googleLoginProvider,

  /**
   * Spotify app client id (app name: "sound-light"). Public identifier; the
   * app uses Authorization Code + PKCE so there is no client secret.
   */
  spotifyClientId: shared.spotifyClientId,

  /** Active music backend implementing the MusicProvider interface. */
  musicProvider: shared.musicProvider as MusicProviderId,
} as const;
