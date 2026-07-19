import { usePlaylists, useUpdatePlaylist } from '~api/hooks';
import { FilterChips } from '~components/molecules/FilterChips';
import { SearchInput } from '~components/molecules/SearchInput';
import { PlaylistGrid } from '~components/organisms/PlaylistGrid';
import { useLivePlaylists } from '~features/live/useLivePlaylists';
import { usePlayerActions } from '~features/player/PlayerContext';
import { useUiStore } from '~stores/uiStore';
import { playlistName } from '~utils/formatUtils';

export const HomePage = () => {
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
      <div className="flex flex-shrink-0 items-center gap-4 px-6 pb-3 pt-[18px]">
        <SearchInput
          className="w-[300px] flex-shrink-0"
          value={liveQuery}
          onChange={setLiveQuery}
          placeholder="Search a location or vibe…"
          ariaLabel="Search playlists"
        />
        <div className="min-w-0 flex-1">
          <FilterChips value={liveFilter} onChange={setLiveFilter} />
        </div>
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
