/** View-model for the Live grid: filter + search + pin-sort the GM's playlists. */
import { useMemo } from 'react';

import { usePlaylists, useUserSettings } from '~api/hooks';
import type { Playlist } from '~shared/contract';
import { usePlayerStore } from '~stores/playerStore';
import { useUiStore } from '~stores/uiStore';
import {
  type Atmosphere,
  atmosphereColor,
  capitalize,
  coverFor,
  DEFAULT_COLUMNS,
} from '~theme/atmosphere';
import { playlistName } from '~utils/formatUtils';

export interface LiveCard {
  id: string;
  location: string;
  atmosphere: Atmosphere;
  name: string;
  coverBg: string;
  atmColor: string;
  pinned: boolean;
  isActive: boolean;
  line1: string;
  line2: string;
}

const toCard = (
  playlist: Playlist,
  combined: boolean,
  playingPlaylistId: string | null,
): LiveCard => {
  const name = playlistName(playlist.location, playlist.atmosphere);
  return {
    id: playlist.id,
    location: playlist.location,
    atmosphere: playlist.atmosphere,
    name,
    coverBg: coverFor(playlist.atmosphere),
    atmColor: atmosphereColor(playlist.atmosphere),
    pinned: playlist.pinned,
    isActive: playlist.id === playingPlaylistId,
    line1: combined ? name : playlist.location,
    line2: combined ? '' : capitalize(playlist.atmosphere),
  };
};

export const useLivePlaylists = () => {
  const { data: playlists = [], isLoading } = usePlaylists();
  const { data: userSettings } = useUserSettings();
  const liveQuery = useUiStore((s) => s.liveQuery);
  const liveFilter = useUiStore((s) => s.liveFilter);
  const playingPlaylistId = usePlayerStore((s) => s.playingPlaylistId);

  const combined = userSettings?.cardLabel === 'combined';
  const cols = userSettings?.columns ?? DEFAULT_COLUMNS;

  const cards = useMemo(() => {
    const q = liveQuery.trim().toLowerCase();
    let list = [...playlists]
      .sort((a, b) => a.sortIndex - b.sortIndex)
      .map((playlist) => toCard(playlist, combined, playingPlaylistId));

    if (q) {
      list = list.filter((c) =>
        `${c.name} ${c.location} ${c.atmosphere}`.toLowerCase().includes(q),
      );
    }
    if (liveFilter !== 'all') {
      list = list.filter((c) => c.atmosphere === liveFilter);
    }
    // Pinned playlists float to the top only when not searching (stable sort).
    if (!q) {
      list = list
        .map((card, index) => ({ card, index }))
        .sort((a, b) => Number(b.card.pinned) - Number(a.card.pinned) || a.index - b.index)
        .map(({ card }) => card);
    }
    return list;
  }, [playlists, liveQuery, liveFilter, combined, playingPlaylistId]);

  return { cards, cols, isLoading };
};
