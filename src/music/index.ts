/** Public surface of the provider-agnostic music layer. */
export type {
  MusicTrack,
  MusicSource,
  MusicSourceKind,
  ResolvedSource,
  MusicSearchResults,
  MusicPlayer,
  MusicProvider,
  MusicProviderCapabilities,
  MusicAuth,
  PlaybackState,
} from './types';

export { MusicProviderProvider, useMusicProvider } from './MusicProviderContext';
export { createActiveMusicProvider, type MusicProviderId } from './registry';
export { useMusicAuth } from './useMusicAuth';
export { useMusicSearch } from './hooks/useMusicSearch';
export { useResolvedSources, useResolvedTracks } from './hooks/useResolvedTracks';
export { musicKeys } from './hooks/queryKeys';
