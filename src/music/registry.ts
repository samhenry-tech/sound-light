/**
 * Provider registry. Today the only backend is Spotify, but selection is
 * centralized here so adding Apple Music / YouTube / local files is a one-line
 * change and the active provider can be chosen in `src/config.ts` or, later,
 * by user setting.
 */
import { appConfig } from '~config';
import { createSpotifyMusicProvider } from '~spotify/provider';

import type { MusicProvider } from './types';

export type MusicProviderId = typeof appConfig.musicProvider;

const factories: Record<MusicProviderId, () => MusicProvider> = {
  spotify: createSpotifyMusicProvider,
};

/** Build the active music provider for this session. */
export const createActiveMusicProvider = (): MusicProvider => {
  const factory = factories[appConfig.musicProvider] ?? factories.spotify;
  return factory();
};
