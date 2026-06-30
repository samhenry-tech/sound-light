import { Icon } from '~components/atoms/Icon';
import { IconButton } from '~components/atoms/IconButton';

import styles from './TrackRow.module.css';

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
    <div className={styles.row}>
      <span className={styles.dot} style={{ background: dotColor }} />
      <span className={styles.meta}>
        <span className={styles.title}>{title}</span>
        <span className={styles.sub}>
          {artist} · {origin}
        </span>
      </span>
      {removable && onRemove && (
        <IconButton icon="close" size={30} iconSize={16} label="Remove track" onClick={onRemove} />
      )}
      {locked && (
        <span className={styles.lock} title="From a locked playlist — remove the playlist above">
          <Icon name="lock" size={15} />
        </span>
      )}
    </div>
  );
}
