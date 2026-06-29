import { cn } from '@/lib/cn';
import { MixCover } from '@/components/molecules';
import type { LiveCard } from '@/features/live/useLiveMixes';
import styles from './MixCard.module.css';

interface MixCardProps {
  card: LiveCard;
  onSelect: () => void;
  onTogglePin: () => void;
}

/** A vibe card in the Live grid. Tap to crossfade; pin in the top-right. */
export function MixCard({ card, onSelect, onTogglePin }: MixCardProps) {
  return (
    <div
      className={cn(styles.card, card.isActive && styles.active)}
      role="button"
      tabIndex={0}
      aria-label={`Play ${card.name}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <MixCover
        gradient={card.coverBg}
        pinned={card.pinned}
        isActive={card.isActive}
        onTogglePin={onTogglePin}
      />
      <div className={styles.body}>
        <div className={styles.line1}>{card.line1}</div>
        {card.line2 && (
          <div className={styles.line2} style={{ color: card.atmColor }}>
            {card.line2}
          </div>
        )}
      </div>
      {card.isActive && <span className={styles.ring} aria-hidden="true" />}
    </div>
  );
}
