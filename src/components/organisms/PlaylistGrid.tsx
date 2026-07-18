import { Spinner } from '~components/atoms/Spinner';
import type { LiveCard } from '~features/live/useLivePlaylists';

import { PlaylistCard } from './PlaylistCard';

interface PlaylistGridProps {
  cards: LiveCard[];
  cols: number;
  isLoading?: boolean;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
}

/** The scrolling grid of Live vibe cards. */
export const PlaylistGrid = ({ cards, cols, isLoading, onSelect, onTogglePin }: PlaylistGridProps) => {
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
        No playlists match — try another vibe or clear the search.
      </div>
    );
  }
  return (
    <div
      className="grid content-start gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {cards.map((card) => (
        <PlaylistCard
          key={card.id}
          card={card}
          onSelect={() => onSelect(card.id)}
          onTogglePin={() => onTogglePin(card.id)}
        />
      ))}
    </div>
  );
};
