import { AccentButton } from '~components/atoms/AccentButton';
import { LibraryRow } from '~components/molecules/LibraryRow';
import { SearchInput } from '~components/molecules/SearchInput';

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
export const LibraryMaster = ({
  rows,
  selectedId,
  query,
  onQuery,
  onNew,
  onSelect,
}: LibraryMasterProps) => {
  return (
    <div className="flex w-[var(--master-w)] min-h-0 flex-shrink-0 flex-col border-r border-line-07">
      <div className="flex-shrink-0 px-[18px] pb-3 pt-5">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-[21px] font-extrabold tracking-[-0.02em]">Library</span>
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
      <div className="flex min-h-0 flex-1 flex-col gap-[3px] overflow-y-auto px-3 pb-4">
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
};
