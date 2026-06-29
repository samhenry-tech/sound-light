import { useMixes, useUpdateMix } from '@/api';
import { FilterChips, SearchInput } from '@/components/molecules';
import { MixGrid } from '@/components/organisms';
import { usePlayerActions } from '@/features/player';
import { useLiveMixes } from '@/features/live/useLiveMixes';
import { useUiStore } from '@/stores/uiStore';
import { mixName } from '@/lib/format';
import styles from './LivePage.module.css';

/** The Live screen — glance, tap a vibe, give feedback. */
export function LivePage() {
  const { cards, cols, isLoading } = useLiveMixes();
  const { data: mixes = [] } = useMixes();
  const updateMix = useUpdateMix();
  const { selectMix } = usePlayerActions();

  const liveQuery = useUiStore((s) => s.liveQuery);
  const setLiveQuery = useUiStore((s) => s.setLiveQuery);
  const liveFilter = useUiStore((s) => s.liveFilter);
  const setLiveFilter = useUiStore((s) => s.setLiveFilter);
  const showToast = useUiStore((s) => s.showToast);

  const onSelect = (id: string) => {
    const mix = mixes.find((m) => m.id === id);
    if (mix) void selectMix(mix);
  };

  const onTogglePin = (id: string) => {
    const mix = mixes.find((m) => m.id === id);
    if (!mix) return;
    updateMix.mutate({ id, input: { pinned: !mix.pinned } });
    const name = mixName(mix.location, mix.atmosphere);
    showToast(mix.pinned ? `Unpinned ${name}` : `Pinned ${name} to top`);
  };

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.session}>
          Curse of the Hollow King <span className={styles.sessionSub}>· Session 14</span>
        </div>
        <SearchInput
          className={styles.search}
          value={liveQuery}
          onChange={setLiveQuery}
          placeholder="Search a location or vibe…"
          ariaLabel="Search mixes"
        />
      </div>
      <div className={styles.filters}>
        <FilterChips value={liveFilter} onChange={setLiveFilter} />
      </div>
      <div className={styles.gridWrap}>
        <MixGrid
          cards={cards}
          cols={cols}
          isLoading={isLoading}
          onSelect={onSelect}
          onTogglePin={onTogglePin}
        />
      </div>
    </div>
  );
}
