import { clsx } from 'clsx';
import type { MouseEvent } from 'react';

import { EqBars } from '~components/atoms/EqBars';
import { GradientCover } from '~components/atoms/GradientCover';

interface MixCoverProps {
  gradient: string;
  artworkUrl?: string;
  pinned: boolean;
  isActive: boolean;
  onTogglePin: () => void;
  height?: number;
}

/** Card cover: atmosphere gradient with a pin tack and (when active) eq bars. */
export const MixCover = ({
  gradient,
  artworkUrl,
  pinned,
  isActive,
  onTogglePin,
  height = 74,
}: MixCoverProps) => {
  const togglePin = (e: MouseEvent) => {
    e.stopPropagation();
    onTogglePin();
  };
  return (
    <GradientCover gradient={gradient} artworkUrl={artworkUrl} height={height}>
      <button
        type="button"
        className="absolute top-[7px] right-[7px] flex h-[30px] w-[30px] items-center justify-center rounded-xs border border-line-10 bg-[rgba(8,10,11,0.42)] cursor-pointer"
        title={pinned ? 'Unpin' : 'Pin to top'}
        aria-label={pinned ? 'Unpin mix' : 'Pin mix to top'}
        aria-pressed={pinned}
        onClick={togglePin}
      >
        <span className={clsx('flex flex-col items-center', !pinned && 'opacity-65')}>
          <span
            className={clsx(
              'h-[9px] w-[9px] rounded-pill',
              pinned
                ? 'bg-accent shadow-[0_0_8px_color-mix(in_srgb,var(--accent)_60%,transparent)]'
                : 'border-[1.5px] border-[rgba(255,255,255,0.5)]',
            )}
          />
          <span
            className={clsx(
              'h-[5px] w-[2px] rounded-b-[2px]',
              pinned ? 'bg-accent' : 'bg-[rgba(255,255,255,0.5)]',
            )}
          />
        </span>
      </button>
      {isActive && (
        <span className="absolute left-[9px] bottom-[9px]">
          <EqBars size={13} />
        </span>
      )}
    </GradientCover>
  );
};
