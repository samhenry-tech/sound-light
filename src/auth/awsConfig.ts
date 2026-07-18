/**
 * AWS + Google client configuration.
 *
 * The app talks to DynamoDB directly from the browser using temporary AWS
 * credentials from a Cognito Identity Pool (Google Sign-In federation).
 *
 * All values are public and live in {@link appConfig} (`src/config.ts`).
 */

import { appConfig } from '~config';

/** Google OAuth 2.0 Web-application client ID (Sign in with Google). */
export const GOOGLE_CLIENT_ID: string = appConfig.googleClientId;

/** Cognito Identity Pool id, e.g. "ap-southeast-2:1a2b3c4d-...". */
export const COGNITO_IDENTITY_POOL_ID: string = appConfig.cognitoIdentityPoolId;

/** AWS region hosting the identity pool + DynamoDB tables. */
export const AWS_REGION = appConfig.awsRegion;

export const PLAYLISTS_TABLE = appConfig.playlistsTable;
export const SETTINGS_TABLE = appConfig.settingsTable;

/** The identity pool login-provider key for Google ID tokens. */
export const GOOGLE_LOGIN_PROVIDER = appConfig.googleLoginProvider;
