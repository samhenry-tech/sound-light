import { useMemo } from 'react';

import { useCreateMix, useMixes } from '~api/hooks';
import { LibraryMaster, type LibraryRowData } from '~components/organisms/LibraryMaster';
import { MixEditor } from '~components/organisms/MixEditor';
import { useMixEditor } from '~features/library/useMixEditor';
import type { Mix } from '~shared/contract';
import { useUiStore } from '~stores/uiStore';
import { coverFor } from '~theme/atmosphere';
import { mixName } from '~utils/formatUtils';

const summarize = (mix: Mix): string => {
  const parts: string[] = [];
  if (mix.sourceUris.length) parts.push(`${mix.sourceUris.length} playlists`);
  if (mix.trackUris.length) parts.push(`${mix.trackUris.length} tracks`);
  return parts.join(' · ') || 'Empty';
};

/** The Library screen — build & edit mixes between sessions. */
export const LibraryPage = () => {
  const { data: mixes = [] } = useMixes();
  const createMix = useCreateMix();

  const libQuery = useUiStore((s) => s.libQuery);
  const setLibQuery = useUiStore((s) => s.setLibQuery);
  const libSelectedId = useUiStore((s) => s.libSelectedId);
  const selectLibrary = useUiStore((s) => s.selectLibrary);
  const showToast = useUiStore((s) => s.showToast);

  const sorted = useMemo(() => [...mixes].sort((a, b) => a.sortIndex - b.sortIndex), [mixes]);
  const selectedId = libSelectedId ?? sorted[0]?.id ?? null;
  const selectedMix = sorted.find((m) => m.id === selectedId);
  const model = useMixEditor(selectedMix);

  const rows: LibraryRowData[] = useMemo(() => {
    const q = libQuery.trim().toLowerCase();
    return sorted
      .map((m) => ({
        id: m.id,
        name: mixName(m.location, m.atmosphere),
        meta: summarize(m),
        gradient: coverFor(m.atmosphere),
      }))
      .filter((r) => !q || r.name.toLowerCase().includes(q));
  }, [sorted, libQuery]);

  const onNew = () => {
    createMix.mutate(
      {},
      {
        onSuccess: (mix) => {
          selectLibrary(mix.id);
          showToast('New mix — name it & search to add tracks');
        },
      },
    );
  };

  return (
    <div className="flex min-h-0 flex-1">
      <LibraryMaster
        rows={rows}
        selectedId={selectedId}
        query={libQuery}
        onQuery={setLibQuery}
        onNew={onNew}
        onSelect={selectLibrary}
      />
      {selectedMix ? (
        <MixEditor mix={selectedMix} model={model} />
      ) : (
        <div className="flex flex-1 items-center justify-center p-10 text-center text-[14px] text-muted-2">
          Create your first mix to start building a vibe.
        </div>
      )}
    </div>
  );
};
