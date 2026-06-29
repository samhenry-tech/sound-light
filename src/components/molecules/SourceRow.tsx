import { Icon, IconButton } from '@/components/atoms';
import styles from './SourceRow.module.css';

interface SourceRowProps {
  name: string;
  owner: string;
  count: number;
  onRemove: () => void;
}

/** A "locked unit" playlist/album row in the editor. */
export function SourceRow({ name, owner, count, onRemove }: SourceRowProps) {
  return (
    <div className={styles.row}>
      <span className={styles.tile}>
        <Icon name="queue_music" size={19} />
      </span>
      <span className={styles.meta}>
        <span className={styles.name}>{name}</span>
        <span className={styles.sub}>
          {owner} · {count} tracks
        </span>
      </span>
      <IconButton icon="close" size={34} label="Remove this playlist" onClick={onRemove} />
    </div>
  );
}
