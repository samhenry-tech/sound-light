import { clsx } from 'clsx';

import { MixCover } from '~components/molecules/MixCover';
import type { LiveCard } from '~features/live/useLiveMixes';

interface MixCardProps {
  card: LiveCard;
  onSelect: () => void;
  onTogglePin: () => void;
}

const CARD =
  'relative flex flex-col overflow-hidden rounded-lg border bg-surface-card text-left text-primary cursor-pointer transition-[border-color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2';

/** A vibe card in the Live grid. Tap to crossfade; pin in the top-right. */
export const MixCard = ({ card, onSelect, onTogglePin }: MixCardProps) => {
  return (
    <div
      className={clsx(
        CARD,
        card.isActive ? 'border-line-08' : 'border-line-08 hover:border-line-20',
      )}
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
      <div className="px-[13px] pb-[13px] pt-[11px]">
        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-bold tracking-[-0.01em]">
          {card.line1}
        </div>
        {card.line2 && (
          <div className="mt-[3px] text-[12px] font-semibold" style={{ color: card.atmColor }}>
            {card.line2}
          </div>
        )}
      </div>
      {card.isActive && (
        <span
          className="pointer-events-none absolute inset-0 rounded-lg border-[1.5px] border-accent shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_30%,transparent),0_0_26px_color-mix(in_srgb,var(--accent)_22%,transparent)]"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
