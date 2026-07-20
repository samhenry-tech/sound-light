import { useMemo, useState } from 'react';

import { useCreatePlaylist, usePlaylists } from '~api/hooks';
import { LibraryMaster, type LibraryRowData } from '~components/organisms/LibraryMaster';
import { PlaylistEditor } from '~components/organisms/PlaylistEditor';
import { usePlaylistEditor } from '~features/library/usePlaylistEditor';
import type { Playlist } from '~shared/contract';
import { useUiStore } from '~stores/uiStore';
import { coverFor } from '~theme/atmosphere';
import { playlistName } from '~utils/formatUtils';

const summarize = (playlist: Playlist): string => {
  const parts: string[] = [];
  if (playlist.sourceUris.length) parts.push(`${playlist.sourceUris.length} playlists`);
  if (playlist.trackUris.length) parts.push(`${playlist.trackUris.length} tracks`);
  return parts.join(' · ') || 'Empty';
};

/** The Library screen — build & edit playlists between sessions. */
export const LibraryPage = () => {
  const { data: playlists = [] } = usePlaylists();
  const createPlaylist = useCreatePlaylist();

  const libQuery = useUiStore((s) => s.libQuery);
  const setLibQuery = useUiStore((s) => s.setLibQuery);
  const libSelectedId = useUiStore((s) => s.libSelectedId);
  const selectLibrary = useUiStore((s) => s.selectLibrary);
  const showToast = useUiStore((s) => s.showToast);

  // Phones show list OR detail; tapping a row opens detail until Back.
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const sorted = useMemo(
    () => [...playlists].sort((a, b) => a.sortIndex - b.sortIndex),
    [playlists],
  );
  const selectedId = libSelectedId ?? sorted[0]?.id ?? null;
  const selectedPlaylist = sorted.find((m) => m.id === selectedId);
  const model = usePlaylistEditor(selectedPlaylist);

  const rows: LibraryRowData[] = useMemo(() => {
    const q = libQuery.trim().toLowerCase();
    return sorted
      .map((m) => ({
        id: m.id,
        name: playlistName(m.location, m.atmosphere),
        meta: summarize(m),
        gradient: coverFor(m.atmosphere),
      }))
      .filter((r) => !q || r.name.toLowerCase().includes(q));
  }, [sorted, libQuery]);

  const onNew = () => {
    createPlaylist.mutate(
      {},
      {
        onSuccess: (playlist) => {
          selectLibrary(playlist.id);
          setMobileDetailOpen(true);
          showToast('New playlist — name it & search to add tracks');
        },
      },
    );
  };

  const onSelect = (id: string) => {
    selectLibrary(id);
    setMobileDetailOpen(true);
  };

  return (
    <div className="flex min-h-0 flex-1">
      <LibraryMaster
        rows={rows}
        selectedId={selectedId}
        query={libQuery}
        onQuery={setLibQuery}
        onNew={onNew}
        onSelect={onSelect}
        className={mobileDetailOpen ? 'max-md:hidden' : undefined}
      />
      {selectedPlaylist ? (
        <div
          className={
            mobileDetailOpen
              ? 'flex min-h-0 min-w-0 flex-1 flex-col'
              : 'hidden min-h-0 min-w-0 flex-1 flex-col md:flex'
          }
        >
          <button
            type="button"
            className="flex flex-shrink-0 items-center gap-1 border-none border-b border-line-07 bg-transparent px-4 py-2.5 text-left text-[13px] font-semibold text-quiet cursor-pointer md:hidden"
            onClick={() => setMobileDetailOpen(false)}
          >
            ← Library
          </button>
          <PlaylistEditor playlist={selectedPlaylist} model={model} />
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center p-10 text-center text-[14px] text-muted-2 md:flex">
          Create your first playlist to start building a vibe.
        </div>
      )}
    </div>
  );
};
