/**
 * Provider-agnostic music types + the {@link MusicProvider} seam.
 *
 * The whole app talks to music through these interfaces and never imports a
 * concrete provider (Spotify, etc.) directly. Swapping in Apple Music, YouTube,
 * or a local-files backend means writing a new `MusicProvider` — nothing in the
 * UI, stores, or data layer changes.
 */

export type MusicSourceKind = 'playlist' | 'album' | 'collection';

/** A single track. `uri` is the provider's canonical identity. */
export interface MusicTrack {
  id: string;
  uri: string;
  title: string;
  artist: string;
  durationMs: number;
  artworkUrl?: string;
}

/** A playlist/album/collection added to a playlist as a locked unit. */
export interface MusicSource {
  id: string;
  uri: string;
  kind: MusicSourceKind;
  name: string;
  owner: string;
  trackCount: number;
  artworkUrl?: string;
}

export interface ResolvedSource extends MusicSource {
  tracks: MusicTrack[];
}

/** Playlisted search results — tracks and whole sources, as the prototype shows. */
export interface MusicSearchResults {
  tracks: MusicTrack[];
  sources: MusicSource[];
}

export interface PlaybackState {
  track: MusicTrack | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
}

/** Imperative playback surface. Implemented per provider. */
export interface MusicPlayer {
  /** Start (or crossfade into) a specific track. */
  playTrack(track: MusicTrack): Promise<void>;
  resume(): Promise<void>;
  pause(): Promise<void>;
  /** Volume in the 0..1 range. */
  setVolume(volume: number): Promise<void>;
  /** Seek within the current track (ms). */
  seek(positionMs: number): Promise<void>;
  /** Subscribe to playback-state changes; returns an unsubscribe function. */
  subscribe(listener: (state: PlaybackState) => void): () => void;
  /** Fires when the current track finishes so the queue can advance. */
  onEnded(listener: () => void): () => void;
  destroy(): void;
}

/** Account-link lifecycle for providers that require OAuth. */
export interface MusicAuth {
  isLinked(): boolean;
  beginLogin(): Promise<void> | void;
  completeLogin(params: URLSearchParams): Promise<void>;
  logout(): void;
  /** Path the provider redirects back to after login (router handles it). */
  readonly callbackPath: string;
}

export interface MusicProviderCapabilities {
  /** Can actually stream audio (vs. search/metadata only). */
  playback: boolean;
  /** Requires a paid tier to play (e.g. Spotify Premium). */
  requiresPremium: boolean;
  canSeek: boolean;
  /** Needs an OAuth account link before use. */
  needsAccountLink: boolean;
}

/** The swappable music backend. */
export interface MusicProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: MusicProviderCapabilities;
  readonly auth: MusicAuth;
  search(query: string): Promise<MusicSearchResults>;
  resolveSources(uris: readonly string[]): Promise<ResolvedSource[]>;
  resolveTracks(uris: readonly string[]): Promise<MusicTrack[]>;
  createPlayer(): MusicPlayer;
}
