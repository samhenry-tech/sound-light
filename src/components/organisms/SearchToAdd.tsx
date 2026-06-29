import { Spinner } from '@/components/atoms';
import { SearchInput, SearchResultRow } from '@/components/molecules';
import type { EditorSearchResult } from '@/features/library/useMixEditor';
import styles from './SearchToAdd.module.css';

interface SearchToAddProps {
  query: string;
  onQuery: (q: string) => void;
  onClear: () => void;
  active: boolean;
  isSearching: boolean;
  results: EditorSearchResult[];
  noResults: boolean;
}

/** The Spotify search-to-add input + floating results dropdown. */
export function SearchToAdd({
  query,
  onQuery,
  onClear,
  active,
  isSearching,
  results,
  noResults,
}: SearchToAddProps) {
  return (
    <div className={styles.wrap}>
      <SearchInput
        value={query}
        onChange={onQuery}
        onClear={onClear}
        leadingIcon="search"
        clearable
        tone="control"
        placeholder="Search Spotify to add tracks or whole playlists…"
        ariaLabel="Search Spotify"
      />
      {active && (
        <div className={styles.dropdown}>
          {results.map((r) => (
            <SearchResultRow
              key={`${r.kind}:${r.uri}`}
              kind={r.kind}
              title={r.title}
              sub={r.sub}
              added={r.added}
              onAdd={r.onAdd}
            />
          ))}
          {isSearching && results.length === 0 && (
            <div className={styles.searching}>
              <Spinner size={16} /> Searching Spotify…
            </div>
          )}
          {noResults && <div className={styles.note}>No matches on Spotify for that.</div>}
        </div>
      )}
    </div>
  );
}
