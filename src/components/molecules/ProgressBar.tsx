import type { KeyboardEvent, MouseEvent } from 'react';
import { formatMs } from '@/lib/format';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  positionMs: number;
  durationMs: number;
  onSeek?: (positionMs: number) => void;
}

const SEEK_STEP_MS = 5000;

/** Elapsed · seekable track · total, driven by player position. */
export function ProgressBar({ positionMs, durationMs, onSeek }: ProgressBarProps) {
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
    <div className={styles.wrap}>
      <span className={styles.time}>{formatMs(positionMs)}</span>
      <div
        className={styles.track}
        role="slider"
        tabIndex={onSeek ? 0 : -1}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(durationMs / 1000)}
        aria-valuenow={Math.round(positionMs / 1000)}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      <span className={styles.time}>{formatMs(durationMs)}</span>
    </div>
  );
}
