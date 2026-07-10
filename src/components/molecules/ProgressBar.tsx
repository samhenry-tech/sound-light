import type { KeyboardEvent, MouseEvent } from 'react';

import { formatMs } from '~utils/formatUtils';

interface ProgressBarProps {
  positionMs: number;
  durationMs: number;
  onSeek?: (positionMs: number) => void;
}

const SEEK_STEP_MS = 5000;

const TIME = 'text-[11px] text-muted-2 flex-shrink-0 min-w-[30px] [font-variant-numeric:tabular-nums]';

/** Elapsed · seekable track · total, driven by player position. */
export const ProgressBar = ({ positionMs, durationMs, onSeek }: ProgressBarProps) => {
  const pct = durationMs > 0 ? Math.min(100, (positionMs / durationMs) * 100) : 0;

  const seekToClient = (clientX: number, el: HTMLElement) => {
    if (!onSeek || durationMs <= 0) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(ratio * durationMs);
  };

  const onClick = (e: MouseEvent<HTMLDivElement>) => seekToClient(e.clientX, e.currentTarget);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    if (e.key === 'ArrowRight') onSeek(Math.min(durationMs, positionMs + SEEK_STEP_MS));
    if (e.key === 'ArrowLeft') onSeek(Math.max(0, positionMs - SEEK_STEP_MS));
  };

  return (
    <div className="flex flex-1 items-center gap-3 min-w-0">
      <span className={`${TIME} text-right`}>{formatMs(positionMs)}</span>
      <div
        className="flex-1 h-1 rounded-pill bg-[rgba(255,255,255,0.1)] overflow-hidden cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[3px]"
        role="slider"
        tabIndex={onSeek ? 0 : -1}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(durationMs / 1000)}
        aria-valuenow={Math.round(positionMs / 1000)}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        <div className="h-full bg-accent rounded-pill" style={{ width: `${pct}%` }} />
      </div>
      <span className={TIME}>{formatMs(durationMs)}</span>
    </div>
  );
};
