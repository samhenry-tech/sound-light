import { Spinner } from '@/components/atoms';
import type { LiveCard } from '@/features/live/useLiveMixes';
import { MixCard } from './MixCard';
import styles from './MixGrid.module.css';

interface MixGridProps {
  cards: LiveCard[];
  cols: number;
  isLoading?: boolean;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
}

/** The scrolling grid of Live vibe cards. */
export function MixGrid({ cards, cols, isLoading, onSelect, onTogglePin }: MixGridProps) {
  if (isLoading) {
    return (
      <div className={styles.center}>
        <Spinner size={22} />
      </div>
    );
  }
  if (cards.length === 0) {
    return <div className={styles.empty}>No mixes match — try another vibe or clear the search.</div>;
  }
  return (
    <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {cards.map((card) => (
        <MixCard
          key={card.id}
          card={card}
          onSelect={() => onSelect(card.id)}
          onTogglePin={() => onTogglePin(card.id)}
        />
      ))}
    </div>
  );
}
