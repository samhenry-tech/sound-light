import { Spinner } from '~components/atoms/Spinner';
import { SearchInput } from '~components/molecules/SearchInput';
import { SearchResultRow } from '~components/molecules/SearchResultRow';
import type { EditorSearchResult } from '~features/library/usePlaylistEditor';

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
export const SearchToAdd = ({
  query,
  onQuery,
  onClear,
  active,
  isSearching,
  results,
  noResults,
}: SearchToAddProps) => {
  return (
    <div className="relative z-[6] flex-shrink-0 px-[26px] pb-1 pt-4">
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
        <div className="absolute left-[26px] right-[26px] top-[62px] z-[8] max-h-[368px] overflow-y-auto rounded-[14px] border border-line-14 bg-[#161a1b] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.6)] animate-[risein_0.16s_ease-out]">
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
            <div className="flex items-center justify-center gap-2 p-3.5 text-[13px] text-muted-2">
              <Spinner size={16} /> Searching Spotify…
            </div>
          )}
          {noResults && (
            <div className="p-[18px] text-center text-[13.5px] text-muted-2">
              No matches on Spotify for that.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
