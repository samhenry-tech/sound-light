/** Account-link lifecycle for providers that require OAuth. */
export interface MusicAuth {
  isLinked(): boolean;
  beginLogin(): Promise<void> | void;
  completeLogin(params: URLSearchParams): Promise<void>;
  logout(): void;
  /** Path the provider redirects back to after login (router handles it). */
  readonly callbackPath: string;
}
