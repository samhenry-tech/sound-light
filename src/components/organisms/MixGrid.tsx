import { Spinner } from '~components/atoms/Spinner';
import type { LiveCard } from '~features/live/useLiveMixes';

import { MixCard } from './MixCard';

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
      <div className="flex justify-center p-[60px]">
        <Spinner size={22} />
      </div>
    );
  }
  if (cards.length === 0) {
    return (
      <div className="p-10 text-center text-[13.5px] text-muted-2">
        No mixes match — try another vibe or clear the search.
      </div>
    );
  }
  return (
    <div
      className="grid content-start gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
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
