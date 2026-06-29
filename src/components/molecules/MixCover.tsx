import type { MouseEvent } from 'react';
import { cn } from '@/lib/cn';
import { EqBars, GradientCover } from '@/components/atoms';
import styles from './MixCover.module.css';

interface MixCoverProps {
  gradient: string;
  artworkUrl?: string;
  pinned: boolean;
  isActive: boolean;
  onTogglePin: () => void;
  height?: number;
}

/** Card cover: atmosphere gradient with a pin tack and (when active) eq bars. */
export function MixCover({
  gradient,
  artworkUrl,
  pinned,
  isActive,
  onTogglePin,
  height = 74,
}: MixCoverProps) {
  const togglePin = (e: MouseEvent) => {
    e.stopPropagation();
    onTogglePin();
  };
  return (
    <GradientCover gradient={gradient} artworkUrl={artworkUrl} height={height}>
      <button
        type="button"
        className={styles.pin}
        title={pinned ? 'Unpin' : 'Pin to top'}
        aria-label={pinned ? 'Unpin mix' : 'Pin mix to top'}
        aria-pressed={pinned}
        onClick={togglePin}
      >
        <span className={cn(styles.tack, pinned ? styles.pinned : styles.unpinned)}>
          <span className={styles.dot} />
          <span className={styles.stem} />
        </span>
      </button>
      {isActive && (
        <span className={styles.eq}>
          <EqBars size={13} />
        </span>
      )}
    </GradientCover>
  );
}
