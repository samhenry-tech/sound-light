import { useMixes, useUpdateMix } from '~api/hooks';
import { FilterChips } from '~components/molecules/FilterChips';
import { SearchInput } from '~components/molecules/SearchInput';
import { MixGrid } from '~components/organisms/MixGrid';
import { useLiveMixes } from '~features/live/useLiveMixes';
import { usePlayerActions } from '~features/player/PlayerContext';
import { useUiStore } from '~stores/uiStore';
import { mixName } from '~utils/formatUtils';

/** The Live screen — glance, tap a vibe, give feedback. */
export const LivePage = () => {
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-shrink-0 items-center justify-between gap-4 px-6 pt-[18px]">
        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-muted-2">
          Curse of the Hollow King <span className="text-faint-2">· Session 14</span>
        </div>
        <SearchInput
          className="w-[300px] flex-shrink-0"
          value={liveQuery}
          onChange={setLiveQuery}
          placeholder="Search a location or vibe…"
          ariaLabel="Search mixes"
        />
      </div>
      <div className="flex-shrink-0 px-6 pt-3.5 pb-3">
        <FilterChips value={liveFilter} onChange={setLiveFilter} />
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 pt-1 pb-[18px]">
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
};
