import { useMemo, useState } from 'react';

import { useCopyGenreDefaults, useDefaultPlaylists } from '~/api/hooks';
import { AccentButton } from '~/components/atoms/AccentButton';
import { Spinner } from '~/components/atoms/Spinner';
import { Modal } from '~/components/molecules/Modal';
import { writeDefaultsModalDismissed } from '~/features/defaults/defaultsModalStorage';
import { type DefaultGenreId, GENRE_PACKS } from '~/models/defaultPlaylists';
import { useUiStore } from '~/stores/uiStore';
import { playlistName } from '~/utils/formatUtils';

interface DefaultPlaylistsModalProps {
  open: boolean;
  onClose: () => void;
  /** Persist dismiss to localStorage when true (backdrop / Not now). */
  persistDismiss?: boolean;
}

/** Genre-pack picker for empty libraries — one card per pack, copies on select. */
export const DefaultPlaylistsModal = ({
  open,
  onClose,
  persistDismiss = true,
}: DefaultPlaylistsModalProps) => {
  const { data: defaults = [], isLoading, isError } = useDefaultPlaylists();
  const copyGenre = useCopyGenreDefaults();
  const showToast = useUiStore((s) => s.showToast);
  const [busyGenre, setBusyGenre] = useState<DefaultGenreId | null>(null);

  const counts = useMemo(() => {
    const map = new Map<string, { playlists: number; tracks: number }>();
    for (const p of defaults) {
      if (!p.genre) continue;
      const prev = map.get(p.genre) ?? { playlists: 0, tracks: 0 };
      map.set(p.genre, {
        playlists: prev.playlists + 1,
        tracks: prev.tracks + p.trackUris.length,
      });
    }
    return map;
  }, [defaults]);

  const ready = defaults.some((p) => p.trackUris.length > 0);

  const dismiss = () => {
    if (persistDismiss) writeDefaultsModalDismissed(true);
    onClose();
  };

  const onSelect = (genre: DefaultGenreId) => {
    const stats = counts.get(genre);
    if (!stats || stats.tracks === 0) {
      showToast('That genre pack isn’t ready yet — check back soon');
      return;
    }
    setBusyGenre(genre);
    copyGenre.mutate(genre, {
      onSuccess: (created) => {
        writeDefaultsModalDismissed(true);
        const sample = created[0];
        showToast(
          sample
            ? `Added ${created.length} playlists · starting with ${playlistName(sample.location, sample.atmosphere)}`
            : `Added ${created.length} playlists`,
        );
        onClose();
      },
      onError: (err) => {
        showToast(err instanceof Error ? err.message : 'Couldn’t copy genre pack');
      },
      onSettled: () => setBusyGenre(null),
    });
  };

  return (
    <Modal open={open} onClose={dismiss} ariaLabel="Choose default playlists" width={560}>
      <div className="px-[22px] pb-[22px] pt-5">
        <h2 className="m-0 text-[20px] font-extrabold tracking-[-0.02em]">
          Start with a genre pack
        </h2>
        <p className="mt-2 mb-5 text-[13.5px] leading-relaxed text-muted">
          Pick a vibe and we’ll copy a set of ready playlists into your library. You can always
          build your own later.
        </p>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-muted-2">
            <Spinner size={18} /> Loading packs…
          </div>
        )}

        {isError && (
          <p className="py-6 text-center text-[13.5px] text-muted-2">
            Couldn’t load default packs. You can create a playlist instead.
          </p>
        )}

        {!isLoading && !isError && !ready && (
          <p className="py-6 text-center text-[13.5px] text-muted-2">
            Default packs aren’t published yet. Create a playlist to get started.
          </p>
        )}

        {!isLoading && ready && (
          <div className="flex flex-col gap-3">
            {GENRE_PACKS.map((pack) => {
              const stats = counts.get(pack.id);
              const hasTracks = (stats?.tracks ?? 0) > 0;
              const busy = busyGenre === pack.id;
              return (
                <button
                  key={pack.id}
                  type="button"
                  disabled={!hasTracks || copyGenre.isPending}
                  onClick={() => onSelect(pack.id)}
                  className="group relative flex min-h-[88px] w-full overflow-hidden rounded-[14px] border border-line-12 bg-transparent p-0 text-left cursor-pointer disabled:cursor-default disabled:opacity-45"
                >
                  <div
                    className="absolute inset-0 opacity-90 transition-opacity duration-150 group-hover:opacity-100"
                    style={{ background: pack.gradient }}
                    aria-hidden
                  />
                  <div className="relative z-[1] flex flex-1 flex-col justify-center gap-1 px-4 py-3.5">
                    <span className="text-[17px] font-extrabold tracking-[-0.02em]">
                      {pack.label}
                    </span>
                    <span className="text-[12.5px] text-white/70">{pack.blurb}</span>
                    {hasTracks && (
                      <span className="text-[11.5px] text-white/50">
                        {stats!.playlists} playlists · {stats!.tracks} tracks
                      </span>
                    )}
                  </div>
                  {busy && (
                    <div className="relative z-[1] flex items-center pr-4">
                      <Spinner size={18} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <AccentButton onClick={dismiss}>Not now</AccentButton>
        </div>
      </div>
    </Modal>
  );
};
