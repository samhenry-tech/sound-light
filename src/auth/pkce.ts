/** PKCE helpers for OAuth Authorization Code flows (no client secret). */

const VERIFIER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

export const randomString = (length: number): string => {
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => VERIFIER_CHARS[v % VERIFIER_CHARS.length]).join('');
};

const base64UrlEncode = (bytes: ArrayBuffer): string => {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const generateCodeVerifier = (): string => {
  return randomString(64);
};

export const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(digest);
};
