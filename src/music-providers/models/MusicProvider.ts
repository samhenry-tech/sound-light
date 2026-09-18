import type { MusicAuth } from './MusicAuth';
import type { MusicPlayer } from './MusicPlayer';
import type { MusicSearchResults } from './MusicSearchResults';
import type { ResolvedSource } from './MusicSource';
import type { MusicTrack } from './MusicTrack';

export interface MusicProviderCapabilities {
  /** Can actually stream audio (vs. search/metadata only). */
  playback: boolean;
  /** Requires a paid tier to play (e.g. Spotify Premium). */
  requiresPremium: boolean;
  canSeek: boolean;
  /** Needs an OAuth account link before use. */
  needsAccountLink: boolean;
}

/**
 * The swappable music backend.
 *
 * The app talks to music only through this interface — never a concrete
 * provider (Spotify, etc.) directly.
 */
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
