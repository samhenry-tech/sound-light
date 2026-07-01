import { AccentButton } from '~components/atoms/AccentButton';
import { Badge } from '~components/atoms/Badge';
import { Icon } from '~components/atoms/Icon';
import { cn } from '~lib/cn';

interface SearchResultRowProps {
  kind: 'playlist' | 'track';
  title: string;
  sub: string;
  added: boolean;
  onAdd: () => void;
}

/** One Spotify search result with an Add / Added ✓ action. */
export function SearchResultRow({ kind, title, sub, added, onAdd }: SearchResultRowProps) {
  return (
    <div className="flex items-center gap-3 p-[9px] rounded-sm hover:bg-[rgba(255,255,255,0.03)]">
      <span
        className={cn(
          'flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-xs',
          kind === 'playlist' ? 'bg-source-bg text-source-icon' : 'bg-[#1a1f20] text-icon-muted',
        )}
      >
        <Icon name={kind === 'playlist' ? 'queue_music' : 'music_note'} size={20} />
      </span>
      <span className="flex flex-1 flex-col gap-0.5 min-w-0">
        <span className="truncate text-[14px] font-semibold">{title}</span>
        <span className="truncate text-[11.5px] text-muted-2">{sub}</span>
      </span>
      <Badge>{kind}</Badge>
      {added ? (
        <span className="flex flex-shrink-0 items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold text-faint">
          <Icon name="check" size={16} />
          Added
        </span>
      ) : (
        <AccentButton onClick={onAdd}>Add</AccentButton>
      )}
    </div>
  );
}
