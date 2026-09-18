/**
 * Provider registry. Today the only backend is Spotify; selection is centralized
 * here so adding another provider is a one-line factory entry and the active
 * provider is chosen in `src/config.ts`.
 */
import { appConfig, type MusicProviderId } from '~/config';
import type { MusicProvider } from '~/music-providers/models/MusicProvider';
import { createSpotifyMusicProvider } from '~/music-providers/spotify/provider';

export type { MusicProviderId };

const factories: Record<MusicProviderId, () => MusicProvider> = {
  spotify: createSpotifyMusicProvider,
};

/** Build the active music provider for this session. */
export const createActiveMusicProvider = (): MusicProvider => {
  const factory = factories[appConfig.musicProvider] ?? factories.spotify;
  return factory();
};
