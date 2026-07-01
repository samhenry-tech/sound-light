import { Icon } from '~components/atoms/Icon';
import { IconButton } from '~components/atoms/IconButton';

interface TrackRowProps {
  title: string;
  artist: string;
  origin: string;
  dotColor: string;
  /** Individually-added tracks can be removed directly. */
  removable?: boolean;
  /** Source-derived tracks show a muted lock instead. */
  locked?: boolean;
  onRemove?: () => void;
}

/** A track line in the editor: atmosphere dot, title, "artist · origin". */
export function TrackRow({
  title,
  artist,
  origin,
  dotColor,
  removable,
  locked,
  onRemove,
}: TrackRowProps) {
  return (
    <div className="flex items-center gap-[13px] px-1.5 py-[9px] border-b border-line-05">
      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-pill" style={{ background: dotColor }} />
      <span className="flex flex-1 flex-col gap-px min-w-0">
        <span className="truncate text-[14px] font-semibold text-primary">{title}</span>
        <span className="truncate text-[11.5px] text-muted-2">
          {artist} · {origin}
        </span>
      </span>
      {removable && onRemove && (
        <IconButton icon="close" size={30} iconSize={16} label="Remove track" onClick={onRemove} />
      )}
      {locked && (
        <span
          className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center text-faint-3"
          title="From a locked playlist — remove the playlist above"
        >
          <Icon name="lock" size={15} />
        </span>
      )}
    </div>
  );
}
