/**
 * Google Identity Services (GIS) + FedCM.
 *
 * A browser-only SPA cannot run Google's authorization-code flow (Google
 * requires a `client_secret` at the token endpoint even with PKCE), so we use
 * GIS to obtain a Google **ID token** directly. That ID token is exactly what
 * the Cognito Identity Pool consumes to vend temporary AWS credentials for
 * DynamoDB — no token exchange, no secret, no backend.
 *
 * GIS also enables a *sliding* session: once the user has signed in via FedCM,
 * we can silently re-mint a fresh ID token with `navigator.credentials.get`
 * (`mediation: 'silent'`) before the current one expires, as long as the user's
 * Google session is still alive. Browsers enforce a ~10-minute quiet period
 * between silent re-auths, which is well within our ~1-hour renewal cadence.
 */
import { GOOGLE_CLIENT_ID } from './awsConfig';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const FEDCM_CONFIG_URL = 'https://accounts.google.com/gsi/fedcm.json';

interface CredentialResponse {
  /** The Google ID token (a JWT). */
  credential: string;
  select_by?: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
    context?: 'signin' | 'signup' | 'use';
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  prompt(): void;
  disableAutoSelect(): void;
  cancel(): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

/** Minimal shape of the credential returned by the FedCM `get()` call. */
interface FedcmTokenCredential {
  token?: string;
}

let scriptPromise: Promise<GoogleAccountsId> | null = null;
let initialized = false;

/** Load the GIS client script once and resolve with `google.accounts.id`. */
const loadGis = (): Promise<GoogleAccountsId> => {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<GoogleAccountsId>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google.accounts.id);
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
      } else {
        reject(new Error('Google Identity Services loaded but is unavailable.'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services.'));
    document.head.appendChild(script);
  });

  return scriptPromise;
};

/**
 * Initialize GIS with the sign-in callback. Safe to call repeatedly; the
 * underlying `initialize` runs once. `onCredential` receives the raw ID token.
 */
export const initializeGoogleAuth = async (
  onCredential: (idToken: string) => void,
): Promise<void> => {
  const id = await loadGis();
  if (initialized) return;

  id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => onCredential(response.credential),
    auto_select: true,
    cancel_on_tap_outside: false,
    use_fedcm_for_prompt: true,
    context: 'signin',
  });
  initialized = true;
};

/** Render the official Google sign-in button into `parent`. */
export const renderGoogleButton = async (parent: HTMLElement): Promise<void> => {
  const id = await loadGis();
  id.renderButton(parent, {
    type: 'standard',
    theme: 'filled_black',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    logo_alignment: 'left',
    width: 300,
  });
};

/** Trigger the One Tap / FedCM prompt (used as a button-less fallback). */
export const promptGoogleSignIn = async (): Promise<void> => {
  const id = await loadGis();
  id.prompt();
};

/** True when the browser exposes the FedCM credential API used for renewal. */
const isFedcmSupported = (): boolean =>
  typeof window !== 'undefined' && 'IdentityCredential' in window && Boolean(navigator.credentials);

/**
 * Silently obtain a fresh Google ID token via FedCM auto-reauthentication.
 * Resolves with a new ID token, or throws if the browser cannot re-auth without
 * user interaction (caller should then fall back to an interactive sign-in).
 */
export const renewGoogleIdTokenSilently = async (): Promise<string> => {
  if (!isFedcmSupported()) {
    throw new Error('Silent renewal is unavailable (FedCM not supported).');
  }

  const credential = (await navigator.credentials.get({
    identity: {
      providers: [{ configURL: FEDCM_CONFIG_URL, clientId: GOOGLE_CLIENT_ID }],
    },
    mediation: 'silent',
  } as unknown as CredentialRequestOptions)) as FedcmTokenCredential | null;

  if (!credential?.token) {
    throw new Error('Silent Google renewal returned no token.');
  }
  return credential.token;
};

/**
 * Clear GIS auto-select and ask the browser not to silently re-auth until the
 * user explicitly signs in again (called on logout).
 */
export const signOutGoogle = async (): Promise<void> => {
  try {
    const id = await loadGis();
    id.disableAutoSelect();
  } catch {
    // GIS not loaded — nothing to disable.
  }
  try {
    await navigator.credentials?.preventSilentAccess?.();
  } catch {
    // preventSilentAccess unsupported or blocked — best effort.
  }
};
