/**
 * AWS + Google client configuration, validated at module load.
 *
 * The app talks to DynamoDB directly from the browser using temporary AWS
 * credentials from a Cognito Identity Pool (Google Sign-In federation), so all
 * five values below are REQUIRED in every environment — including local dev.
 * There is deliberately no offline/localStorage bypass: a missing var fails
 * fast at startup with a descriptive error instead of silently degrading.
 *
 * Tests may stub these via `vi.stubEnv(...)` (see src/test/setup.ts).
 */

const requireEnv = (name: string): string => {
  const value = import.meta.env[name] as string | undefined;
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        'Copy .env.example to .env.local and fill in every value ' +
        '(from `terraform output` in infra/ and your Google OAuth client). ' +
        'The app cannot run without its AWS + Google configuration.',
    );
  }
  return value;
};

/** Google OAuth 2.0 Web-application client ID (Sign in with Google). */
export const GOOGLE_CLIENT_ID: string = requireEnv('VITE_GOOGLE_CLIENT_ID');

/** Cognito Identity Pool id, e.g. "us-east-1:1a2b3c4d-...". */
export const COGNITO_IDENTITY_POOL_ID: string = requireEnv('VITE_COGNITO_IDENTITY_POOL_ID');

/** AWS region hosting the identity pool + DynamoDB tables. */
export const AWS_REGION: string = requireEnv('VITE_AWS_REGION');

/** DynamoDB table names (from `terraform output`). */
export const MIXES_TABLE: string = requireEnv('VITE_MIXES_TABLE');
/** DynamoDB user-settings table name (from `terraform output`). */
export const SETTINGS_TABLE: string = requireEnv('VITE_SETTINGS_TABLE');

/** The identity pool login-provider key for Google ID tokens. */
export const GOOGLE_LOGIN_PROVIDER = 'accounts.google.com';
