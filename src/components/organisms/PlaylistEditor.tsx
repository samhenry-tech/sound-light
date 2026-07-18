import { GradientCover } from '~components/atoms/GradientCover';
import { Icon } from '~components/atoms/Icon';
import { Select } from '~components/molecules/Select';
import { SourceRow } from '~components/molecules/SourceRow';
import { TrackRow } from '~components/molecules/TrackRow';
import type { PlaylistEditorModel } from '~features/library/usePlaylistEditor';
import type { Playlist } from '~shared/contract';
import { useUiStore } from '~stores/uiStore';
import {
  type Atmosphere,
  atmosphereColor,
  ATMOSPHERES,
  capitalize,
  coverFor,
  LOCATIONS,
} from '~theme/atmosphere';
import { playlistName } from '~utils/formatUtils';

import { BanishedPanel } from './BanishedPanel';
import { SearchToAdd } from './SearchToAdd';

const SECTION_LABEL = 'mb-2.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-faint';

interface PlaylistEditorProps {
  playlist: Playlist;
  model: PlaylistEditorModel;
}

/** The Library detail editor for one playlist. */
export const PlaylistEditor = ({ playlist, model }: PlaylistEditorProps) => {
  const editorQuery = useUiStore((s) => s.editorQuery);
  const setEditorQuery = useUiStore((s) => s.setEditorQuery);
  const clearEditorQuery = useUiStore((s) => s.clearEditorQuery);
  const showBanished = useUiStore((s) => s.showBanished);
  const toggleBanished = useUiStore((s) => s.toggleBanished);

  const name = playlistName(playlist.location, playlist.atmosphere);
  const dotColor = atmosphereColor(playlist.atmosphere);
  const count = model.active.length + model.banished.length;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex flex-shrink-0 items-center gap-[18px] border-b border-line-07 px-[26px] pb-4 pt-[22px]">
        <GradientCover
          gradient={coverFor(playlist.atmosphere)}
          width={64}
          height={64}
          radius={15}
        />
        <div className="min-w-0 flex-1">
          <div className="mb-[9px] text-[22px] font-extrabold tracking-[-0.02em]">{name}</div>
          <div className="flex items-center gap-[9px]">
            <Select
              value={playlist.location}
              options={LOCATIONS.map((l) => ({ value: l, label: l }))}
              onChange={model.actions.setLocation}
              ariaLabel="Location"
            />
            <span className="font-bold text-faint-2">—</span>
            <Select
              value={playlist.atmosphere}
              options={ATMOSPHERES.map((a) => ({ value: a, label: capitalize(a) }))}
              onChange={(v) => model.actions.setAtmosphere(v as Atmosphere)}
              ariaLabel="Atmosphere"
            />
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <span className="text-[13px] text-muted">{count} tracks</span>
          <button
            type="button"
            className="flex items-center gap-[5px] rounded-xs border border-line-10 bg-transparent px-[11px] py-1.5 text-[12.5px] font-semibold text-icon-muted cursor-pointer"
            onClick={model.actions.remove}
          >
            <Icon name="delete" size={16} />
            Delete
          </button>
        </div>
      </div>

      <SearchToAdd
        query={editorQuery}
        onQuery={setEditorQuery}
        onClear={clearEditorQuery}
        active={model.searchActive}
        isSearching={model.isSearching}
        results={model.results}
        noResults={model.noResults}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-[26px] pb-[26px] pt-3.5">
        {model.sources.length > 0 && (
          <>
            <div className={SECTION_LABEL}>Playlists added · locked units</div>
            {model.sources.map((s) => (
              <SourceRow
                key={s.uri}
                name={s.name}
                owner={s.owner}
                count={s.trackCount}
                onRemove={() => model.actions.removeSource(s.uri)}
              />
            ))}
          </>
        )}

        <div className="mb-2 mt-4 flex items-center justify-between">
          <span className={SECTION_LABEL}>Tracks</span>
          {model.banished.length > 0 && (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-xs border border-danger-30 bg-transparent px-[11px] py-1.5 text-[12px] font-semibold text-danger-text-2 cursor-pointer"
              onClick={toggleBanished}
            >
              <Icon name="block" size={16} />
              Banished ({model.banished.length})
            </button>
          )}
        </div>

        {model.active.map((t) => (
          <TrackRow
            key={t.uri}
            title={t.title}
            artist={t.artist}
            origin={t.origin}
            dotColor={dotColor}
            removable={!t.fromSource}
            locked={t.fromSource}
            onRemove={() => model.actions.removeTrack(t.uri)}
          />
        ))}

        {count === 0 && (
          <div className="rounded-[14px] border border-dashed border-line-12 p-[26px] text-center text-[13.5px] text-muted-2">
            Nothing here yet — search Spotify above to add tracks or a whole playlist.
          </div>
        )}

        {showBanished && model.banished.length > 0 && (
          <BanishedPanel
            tracks={model.banished.map((t) => ({
              uri: t.uri,
              title: t.title,
              artist: t.artist,
              origin: t.origin,
            }))}
            onRestore={model.actions.restoreTrack}
          />
        )}
      </div>
    </div>
  );
};
