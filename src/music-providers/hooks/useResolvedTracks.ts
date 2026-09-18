import { useQuery } from '@tanstack/react-query';

import { useMusicProvider } from '../MusicProviderContext';
import { musicKeys } from './queryKeys';

const FIVE_MIN = 5 * 60_000;

/** Resolve playlist/album source URIs to their full track lists. */
export const useResolvedSources = (uris: readonly string[]) => {
  const provider = useMusicProvider();
  return useQuery({
    queryKey: musicKeys.sources(provider.id, uris),
    queryFn: () => provider.resolveSources(uris),
    enabled: uris.length > 0,
    staleTime: FIVE_MIN,
  });
};

/** Resolve individually-added track URIs to track metadata. */
export const useResolvedTracks = (uris: readonly string[]) => {
  const provider = useMusicProvider();
  return useQuery({
    queryKey: musicKeys.tracks(provider.id, uris),
    queryFn: () => provider.resolveTracks(uris),
    enabled: uris.length > 0,
    staleTime: FIVE_MIN,
  });
};
