import { Icon } from '~components/atoms/Icon';
import { IconButton } from '~components/atoms/IconButton';

interface SourceRowProps {
  name: string;
  owner: string;
  count: number;
  onRemove: () => void;
}

/** A "locked unit" playlist/album row in the editor. */
export const SourceRow = ({ name, owner, count, onRemove }: SourceRowProps) => {
  return (
    <div className="flex items-center gap-[13px] mb-2 px-3.5 py-[11px] bg-surface-card border border-line-08 rounded-md">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xs bg-source-bg text-source-icon">
        <Icon name="queue_music" size={19} />
      </span>
      <span className="flex flex-1 flex-col gap-0.5 min-w-0">
        <span className="truncate text-[14px] font-semibold">{name}</span>
        <span className="text-[11.5px] text-muted-2">
          {owner} · {count} tracks
        </span>
      </span>
      <IconButton icon="close" size={34} label="Remove this playlist" onClick={onRemove} />
    </div>
  );
};
