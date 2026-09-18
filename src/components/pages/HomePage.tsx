import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  useCreatePlaylist,
  useDefaultPlaylists,
  usePlaylists,
  useUpdatePlaylist,
} from '~/api/hooks';
import { AccentButton } from '~/components/atoms/AccentButton';
import { Spinner } from '~/components/atoms/Spinner';
import { FilterChips } from '~/components/molecules/FilterChips';
import { SearchInput } from '~/components/molecules/SearchInput';
import { DefaultPlaylistsModal } from '~/components/organisms/DefaultPlaylistsModal';
import { PlaylistGrid } from '~/components/organisms/PlaylistGrid';
import {
  readDefaultsModalDismissed,
  writeDefaultsModalDismissed,
} from '~/features/defaults/defaultsModalStorage';
import { useLivePlaylists } from '~/features/live/useLivePlaylists';
import { usePlayerActions } from '~/features/player/PlayerContext';
import { useUiStore } from '~/stores/uiStore';
import { playlistName } from '~/utils/formatUtils';

export const HomePage = () => {
  const navigate = useNavigate();
  const { cards, isLoading } = useLivePlaylists();
  const { data: playlists = [], isLoading: playlistsLoading } = usePlaylists();
  const { data: defaults = [], isLoading: defaultsLoading } = useDefaultPlaylists();
  const createPlaylist = useCreatePlaylist();
  const updatePlaylist = useUpdatePlaylist();
  const { selectPlaylist } = usePlayerActions();

  const liveQuery = useUiStore((s) => s.liveQuery);
  const setLiveQuery = useUiStore((s) => s.setLiveQuery);
  const liveFilter = useUiStore((s) => s.liveFilter);
  const setLiveFilter = useUiStore((s) => s.setLiveFilter);
  const showToast = useUiStore((s) => s.showToast);
  const selectLibrary = useUiStore((s) => s.selectLibrary);

  const [dismissed, setDismissed] = useState(readDefaultsModalDismissed);
  const [pickerOpen, setPickerOpen] = useState(false);

  const empty = !playlistsLoading && playlists.length === 0;
  const defaultsReady = defaults.some((p) => p.trackUris.length > 0);

  // Auto-open the genre picker once when the library is empty and packs exist.
  useEffect(() => {
    if (!empty || dismissed || defaultsLoading || !defaultsReady) return;
    setPickerOpen(true);
  }, [empty, dismissed, defaultsLoading, defaultsReady]);

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

  const onCreate = () => {
    writeDefaultsModalDismissed(true);
    setDismissed(true);
    createPlaylist.mutate(
      {},
      {
        onSuccess: (playlist) => {
          selectLibrary(playlist.id);
          void navigate('/library');
          showToast('New playlist — name it & search to add tracks');
        },
      },
    );
  };

  const onClosePicker = () => {
    setPickerOpen(false);
    setDismissed(readDefaultsModalDismissed());
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-shrink-0 flex-wrap items-center gap-3 px-4 pb-3 pt-4 sm:gap-4 sm:px-6 sm:pt-[18px]">
        <SearchInput
          className="w-full min-w-0 flex-shrink-0 sm:w-[300px]"
          value={liveQuery}
          onChange={setLiveQuery}
          placeholder="Search a location or vibe…"
          ariaLabel="Search playlists"
        />
        <div className="min-w-0 flex-1 basis-full sm:basis-auto">
          <FilterChips value={liveFilter} onChange={setLiveFilter} />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-1 pb-[18px] sm:px-6">
        {empty ? (
          <EmptyLibrary
            loading={playlistsLoading || defaultsLoading}
            defaultsReady={defaultsReady}
            dismissed={dismissed}
            creating={createPlaylist.isPending}
            onCreate={onCreate}
            onChooseDefaults={() => setPickerOpen(true)}
          />
        ) : (
          <PlaylistGrid
            cards={cards}
            isLoading={isLoading}
            onSelect={onSelect}
            onTogglePin={onTogglePin}
          />
        )}
      </div>

      {empty && <DefaultPlaylistsModal open={pickerOpen} onClose={onClosePicker} persistDismiss />}
    </div>
  );
};

interface EmptyLibraryProps {
  loading: boolean;
  defaultsReady: boolean;
  dismissed: boolean;
  creating: boolean;
  onCreate: () => void;
  onChooseDefaults: () => void;
}

const EmptyLibrary = ({
  loading,
  defaultsReady,
  dismissed,
  creating,
  onCreate,
  onChooseDefaults,
}: EmptyLibraryProps) => {
  if (loading) {
    return (
      <div className="flex justify-center p-10 sm:p-[60px]">
        <Spinner size={22} />
      </div>
    );
  }

  // While the auto-modal may be open, still show a quiet empty state behind it.
  if (!dismissed && defaultsReady) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="m-0 text-[14px] text-muted-2">Choose a genre pack to fill your library.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="m-0 max-w-[340px] text-[15px] leading-relaxed text-quiet">
        Your library is empty. Create a playlist or start from a genre pack.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <AccentButton icon="add" onClick={onCreate} disabled={creating}>
          Create playlist
        </AccentButton>
        {defaultsReady && (
          <AccentButton onClick={onChooseDefaults}>Select from defaults</AccentButton>
        )}
      </div>
    </div>
  );
};
