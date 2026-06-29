import { AccentButton, Badge, Icon } from '@/components/atoms';
import { cn } from '@/lib/cn';
import styles from './SearchResultRow.module.css';

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
    <div className={styles.row}>
      <span className={cn(styles.tile, styles[kind])}>
        <Icon name={kind === 'playlist' ? 'queue_music' : 'music_note'} size={20} />
      </span>
      <span className={styles.meta}>
        <span className={styles.title}>{title}</span>
        <span className={styles.sub}>{sub}</span>
      </span>
      <Badge>{kind}</Badge>
      {added ? (
        <span className={styles.added}>
          <Icon name="check" size={16} />
          Added
        </span>
      ) : (
        <AccentButton onClick={onAdd}>Add</AccentButton>
      )}
    </div>
  );
}
