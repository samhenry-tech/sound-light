/** View-model for the Live grid: filter + search + pin-sort the GM's mixes. */
import { useMemo } from 'react';
import { useMixes, usePrefs } from '@/api';
import type { Mix } from '@/shared/contract';
import { usePlayerStore } from '@/stores/playerStore';
import { useUiStore } from '@/stores/uiStore';
import {
  atmosphereColor,
  capitalize,
  coverFor,
  DEFAULT_COLUMNS,
  type Atmosphere,
} from '@/theme/atmosphere';
import { mixName } from '@/lib/format';

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

function toCard(mix: Mix, combined: boolean, playingMixId: string | null): LiveCard {
  const name = mixName(mix.location, mix.atmosphere);
  return {
    id: mix.id,
    location: mix.location,
    atmosphere: mix.atmosphere,
    name,
    coverBg: coverFor(mix.atmosphere),
    atmColor: atmosphereColor(mix.atmosphere),
    pinned: mix.pinned,
    isActive: mix.id === playingMixId,
    line1: combined ? name : mix.location,
    line2: combined ? '' : capitalize(mix.atmosphere),
  };
}

export function useLiveMixes() {
  const { data: mixes = [], isLoading } = useMixes();
  const { data: prefs } = usePrefs();
  const liveQuery = useUiStore((s) => s.liveQuery);
  const liveFilter = useUiStore((s) => s.liveFilter);
  const playingMixId = usePlayerStore((s) => s.playingMixId);

  const combined = prefs?.cardLabel === 'combined';
  const cols = prefs?.columns ?? DEFAULT_COLUMNS;

  const cards = useMemo(() => {
    const q = liveQuery.trim().toLowerCase();
    let list = [...mixes]
      .sort((a, b) => a.sortIndex - b.sortIndex)
      .map((mix) => toCard(mix, combined, playingMixId));

    if (q) {
      list = list.filter((c) =>
        `${c.name} ${c.location} ${c.atmosphere}`.toLowerCase().includes(q),
      );
    }
    if (liveFilter !== 'all') {
      list = list.filter((c) => c.atmosphere === liveFilter);
    }
    // Pinned mixes float to the top only when not searching (stable sort).
    if (!q) {
      list = list
        .map((card, index) => ({ card, index }))
        .sort((a, b) => Number(b.card.pinned) - Number(a.card.pinned) || a.index - b.index)
        .map(({ card }) => card);
    }
    return list;
  }, [mixes, liveQuery, liveFilter, combined, playingMixId]);

  return { cards, cols, isLoading };
}
