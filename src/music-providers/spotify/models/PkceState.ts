/** Transient PKCE state held in sessionStorage during the OAuth redirect. */
export interface PkceState {
  verifier: string;
  state: string;
}
