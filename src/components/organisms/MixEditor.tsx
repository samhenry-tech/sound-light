import { GradientCover, Icon } from '@/components/atoms';
import { Select, SourceRow, TrackRow } from '@/components/molecules';
import type { Mix } from '@/shared/contract';
import type { MixEditorModel } from '@/features/library/useMixEditor';
import { useUiStore } from '@/stores/uiStore';
import {
  ATMOSPHERES,
  LOCATIONS,
  atmosphereColor,
  capitalize,
  coverFor,
  type Atmosphere,
} from '@/theme/atmosphere';
import { mixName } from '@/lib/format';
import { BanishedPanel } from './BanishedPanel';
import { SearchToAdd } from './SearchToAdd';
import styles from './MixEditor.module.css';

interface MixEditorProps {
  mix: Mix;
  model: MixEditorModel;
}

/** The Library detail editor for one mix. */
export function MixEditor({ mix, model }: MixEditorProps) {
  const editorQuery = useUiStore((s) => s.editorQuery);
  const setEditorQuery = useUiStore((s) => s.setEditorQuery);
  const clearEditorQuery = useUiStore((s) => s.clearEditorQuery);
  const showBanished = useUiStore((s) => s.showBanished);
  const toggleBanished = useUiStore((s) => s.toggleBanished);

  const name = mixName(mix.location, mix.atmosphere);
  const dotColor = atmosphereColor(mix.atmosphere);
  const count = model.active.length + model.banished.length;

  return (
    <div className={styles.detail}>
      <div className={styles.header}>
        <GradientCover gradient={coverFor(mix.atmosphere)} width={64} height={64} radius={15} />
        <div className={styles.headMain}>
          <div className={styles.name}>{name}</div>
          <div className={styles.selects}>
            <Select
              value={mix.location}
              options={LOCATIONS.map((l) => ({ value: l, label: l }))}
              onChange={model.actions.setLocation}
              ariaLabel="Location"
            />
            <span className={styles.dash}>—</span>
            <Select
              value={mix.atmosphere}
              options={ATMOSPHERES.map((a) => ({ value: a, label: capitalize(a) }))}
              onChange={(v) => model.actions.setAtmosphere(v as Atmosphere)}
              ariaLabel="Atmosphere"
            />
          </div>
        </div>
        <div className={styles.headRight}>
          <span className={styles.count}>{count} tracks</span>
          <button type="button" className={styles.delete} onClick={model.actions.remove}>
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

      <div className={styles.contents}>
        {model.sources.length > 0 && (
          <>
            <div className={styles.sectionLabel}>Playlists added · locked units</div>
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

        <div className={styles.tracksHead}>
          <span className={styles.sectionLabel}>Tracks</span>
          {model.banished.length > 0 && (
            <button type="button" className={styles.banishedToggle} onClick={toggleBanished}>
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
          <div className={styles.empty}>
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
}
