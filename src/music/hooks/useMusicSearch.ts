import { useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '~lib/useDebouncedValue';

import { useMusicProvider } from '../MusicProviderContext';
import type { MusicSearchResults } from '../types';
import { musicKeys } from './queryKeys';

const EMPTY: MusicSearchResults = { tracks: [], sources: [] };

/** Debounced search powering the Library's "search-to-add" dropdown. */
export function useMusicSearch(query: string) {
  const provider = useMusicProvider();
  const debounced = useDebouncedValue(query.trim(), 250);
  const enabled = debounced.length > 0;

  const result = useQuery({
    queryKey: musicKeys.search(provider.id, debounced),
    queryFn: () => provider.search(debounced),
    enabled,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  return {
    results: result.data ?? EMPTY,
    isSearching: enabled && result.isFetching,
    isActive: enabled,
  };
}
