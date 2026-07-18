/**
 * AWS + Google client configuration.
 *
 * The app talks to DynamoDB directly from the browser using temporary AWS
 * credentials from a Cognito Identity Pool (Google Sign-In federation).
 *
 * Fixed infrastructure values (region, DynamoDB table names) are hardcoded
 * below because they never differ between environments — the app always targets
 * the same backend. Only the identity values that could vary per deployment
 * (Google client id, identity pool id) are read from env and required at load.
 *
 * Tests may stub the env values via `vi.stubEnv(...)` (see src/test/setup.ts).
 */

const requireEnv = (name: string): string => {
  const value = import.meta.env[name] as string | undefined;
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        'Copy .env.example to .env.local and fill in every value ' +
        '(the identity pool id from `terraform output` in infra/ and your ' +
        'Google OAuth client id). The app cannot run without them.',
    );
  }
  return value;
};

/** Google OAuth 2.0 Web-application client ID (Sign in with Google). */
export const GOOGLE_CLIENT_ID: string = requireEnv('VITE_GOOGLE_CLIENT_ID');

/** Cognito Identity Pool id, e.g. "ap-southeast-2:1a2b3c4d-...". */
export const COGNITO_IDENTITY_POOL_ID: string = requireEnv('VITE_COGNITO_IDENTITY_POOL_ID');

/** AWS region hosting the identity pool + DynamoDB tables. */
export const AWS_REGION = 'ap-southeast-2';

// DynamoDB table names follow Terraform's "${project}-${environment}-*" naming
// (see infra/dynamodb.tf). Update these if the project/environment names change.
export const MIXES_TABLE = 'soung-light-dev-mixes';
export const SETTINGS_TABLE = 'soung-light-dev-user-settings';

/** The identity pool login-provider key for Google ID tokens. */
export const GOOGLE_LOGIN_PROVIDER = 'accounts.google.com';
