import { Spinner } from '~components/atoms/Spinner';
import type { LiveCard } from '~features/live/useLivePlaylists';

import { PlaylistCard } from './PlaylistCard';

interface PlaylistGridProps {
  cards: LiveCard[];
  isLoading?: boolean;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
}

/**
 * The scrolling grid of Live vibe cards. Column count is CSS-driven so it
 * adapts from phones (~2) through tablets to desktop (~5).
 */
export const PlaylistGrid = ({ cards, isLoading, onSelect, onTogglePin }: PlaylistGridProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-10 sm:p-[60px]">
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
    <div className="grid grid-cols-2 content-start gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
