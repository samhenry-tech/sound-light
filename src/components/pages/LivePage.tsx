import { usePlaylists, useUpdatePlaylist } from '~api/hooks';
import { FilterChips } from '~components/molecules/FilterChips';
import { SearchInput } from '~components/molecules/SearchInput';
import { PlaylistGrid } from '~components/organisms/PlaylistGrid';
import { useLivePlaylists } from '~features/live/useLivePlaylists';
import { usePlayerActions } from '~features/player/PlayerContext';
import { useUiStore } from '~stores/uiStore';
import { playlistName } from '~utils/formatUtils';

/** The Live screen — glance, tap a vibe, give feedback. */
export const LivePage = () => {
  const { cards, cols, isLoading } = useLivePlaylists();
  const { data: playlists = [] } = usePlaylists();
  const updatePlaylist = useUpdatePlaylist();
  const { selectPlaylist } = usePlayerActions();

  const liveQuery = useUiStore((s) => s.liveQuery);
  const setLiveQuery = useUiStore((s) => s.setLiveQuery);
  const liveFilter = useUiStore((s) => s.liveFilter);
  const setLiveFilter = useUiStore((s) => s.setLiveFilter);
  const showToast = useUiStore((s) => s.showToast);

  const onSelect = (id: string) => {
    const playlist = playlists.find((m) => m.id === id);
    if (playlist) void selectPlaylist(playlist);
  };

  const onTogglePin = (id: string) => {
    const playlist = playlists.find((m) => m.id === id);
    if (!playlist) return;
    updatePlaylist.mutate({ id, input: { pinned: !playlist.pinned } });
    const name = playlistName(playlist.location, playlist.atmosphere);
    showToast(playlist.pinned ? `Unpinned ${name}` : `Pinned ${name} to top`);
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
          ariaLabel="Search playlists"
        />
      </div>
      <div className="flex-shrink-0 px-6 pt-3.5 pb-3">
        <FilterChips value={liveFilter} onChange={setLiveFilter} />
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 pt-1 pb-[18px]">
        <PlaylistGrid
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
