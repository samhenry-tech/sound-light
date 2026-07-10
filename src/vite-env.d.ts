/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_COGNITO_IDENTITY_POOL_ID?: string;
  readonly VITE_AWS_REGION?: string;
  readonly VITE_MIXES_TABLE?: string;
  readonly VITE_SETTINGS_TABLE?: string;
  readonly VITE_SPOTIFY_CLIENT_ID?: string;
  readonly VITE_SPOTIFY_REDIRECT_URI?: string;
  readonly VITE_SPOTIFY_MOCK?: string;
  readonly VITE_MUSIC_PROVIDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
