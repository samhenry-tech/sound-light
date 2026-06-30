import { GradientCover } from '~components/atoms/GradientCover';
import { cn } from '~lib/cn';

import styles from './LibraryRow.module.css';

interface LibraryRowProps {
  name: string;
  meta: string;
  gradient: string;
  artworkUrl?: string;
  selected: boolean;
  onSelect: () => void;
}

/** A mix row in the Library master list. */
export function LibraryRow({
  name,
  meta,
  gradient,
  artworkUrl,
  selected,
  onSelect,
}: LibraryRowProps) {
  return (
    <button
      type="button"
      className={cn(styles.row, selected && styles.selected)}
      aria-current={selected}
      onClick={onSelect}
    >
      <GradientCover
        gradient={gradient}
        artworkUrl={artworkUrl}
        width={40}
        height={40}
        radius={10}
      />
      <span className={styles.meta}>
        <span className={styles.name}>{name}</span>
        <span className={styles.sub}>{meta}</span>
      </span>
    </button>
  );
}
