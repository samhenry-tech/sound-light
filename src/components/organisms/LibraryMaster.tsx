import { AccentButton } from '@/components/atoms';
import { LibraryRow, SearchInput } from '@/components/molecules';
import styles from './LibraryMaster.module.css';

export interface LibraryRowData {
  id: string;
  name: string;
  meta: string;
  gradient: string;
  artworkUrl?: string;
}

interface LibraryMasterProps {
  rows: LibraryRowData[];
  selectedId: string | null;
  query: string;
  onQuery: (q: string) => void;
  onNew: () => void;
  onSelect: (id: string) => void;
}

/** Library master column: title, New, a filter, and the list of mixes. */
export function LibraryMaster({
  rows,
  selectedId,
  query,
  onQuery,
  onNew,
  onSelect,
}: LibraryMasterProps) {
  return (
    <div className={styles.master}>
      <div className={styles.head}>
        <div className={styles.titleRow}>
          <span className={styles.title}>Library</span>
          <AccentButton icon="add" onClick={onNew}>
            New
          </AccentButton>
        </div>
        <SearchInput
          value={query}
          onChange={onQuery}
          placeholder="Find a mix…"
          ariaLabel="Filter mixes"
        />
      </div>
      <div className={styles.list}>
        {rows.map((row) => (
          <LibraryRow
            key={row.id}
            name={row.name}
            meta={row.meta}
            gradient={row.gradient}
            artworkUrl={row.artworkUrl}
            selected={row.id === selectedId}
            onSelect={() => onSelect(row.id)}
          />
        ))}
      </div>
    </div>
  );
}
