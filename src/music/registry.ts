/**
 * Provider registry. Today the only backend is Spotify, but selection is
 * centralized here so adding Apple Music / YouTube / local files is a one-line
 * change and the active provider can be chosen by env or, later, user setting.
 */
import { createSpotifyMusicProvider } from '@/spotify';
import type { MusicProvider } from './types';

export type MusicProviderId = 'spotify';

const factories: Record<MusicProviderId, () => MusicProvider> = {
  spotify: createSpotifyMusicProvider,
};

/** Build the active music provider for this session. */
export function createActiveMusicProvider(): MusicProvider {
  const id = (import.meta.env.VITE_MUSIC_PROVIDER as MusicProviderId | undefined) ?? 'spotify';
  const factory = factories[id] ?? factories.spotify;
  return factory();
}
