/**
 * Public client configuration. Everything here is intentionally committed —
 * these values ship in the SPA bundle. Do not put secrets in this file.
 *
 * After `terraform apply`, update the Cognito identity pool id (and table
 * names / region if you changed those Terraform inputs) from
 * `terraform output` in `infra/`.
 */

export const appConfig = {
  /** Google OAuth 2.0 Web-application client ID (Sign in with Google). */
  googleClientId: '728917661766-qn9fosl7al289fhga3583sv7n4p3lmdj.apps.googleusercontent.com',

  /** Cognito Identity Pool id (`terraform output cognito_identity_pool_id`). */
  cognitoIdentityPoolId: 'ap-southeast-2:bbe6ca47-ba04-42bd-82da-bf9768b48ae9',

  /** AWS region hosting the identity pool + DynamoDB tables. */
  awsRegion: 'ap-southeast-2',

  // DynamoDB table names follow Terraform's "${project}-${environment}-*" naming
  // (see infra/dynamodb.tf). Update these if the project/environment names change.
  mixesTable: 'sound-light-dev-mixes',
  settingsTable: 'sound-light-dev-user-settings',

  /** The identity pool login-provider key for Google ID tokens. */
  googleLoginProvider: 'accounts.google.com',

  /**
   * Spotify app client id (app name: "sound-light"). Public identifier; the
   * app uses Authorization Code + PKCE so there is no client secret.
   */
  spotifyClientId: 'a35ad70cf30442f0a53ba22a95e85c8e',

  /**
   * Use the bundled mock Spotify catalog/player outside production builds
   * (no Premium account required). `vite build` sets PROD=true so deploys
   * hit the real Spotify API.
   */
  spotifyMock: !import.meta.env.PROD,

  /** Active music backend implementing the MusicProvider interface. */
  musicProvider: 'spotify' as const,
} as const;
