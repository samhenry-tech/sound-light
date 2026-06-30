import type { CSSProperties, ReactNode } from 'react';

import { cn } from '~lib/cn';

import styles from './GradientCover.module.css';

interface GradientCoverProps {
  /** Atmosphere gradient used as fallback cover art. */
  gradient: string;
  /** Real artwork (Spotify), preferred when present. */
  artworkUrl?: string;
  width?: number | string;
  height?: number | string;
  radius?: number;
  /** Soft top-left white highlight (now-playing thumb). */
  highlight?: boolean;
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

/** A cover tile backed by an atmosphere gradient or real artwork. */
export function GradientCover({
  gradient,
  artworkUrl,
  width = '100%',
  height,
  radius,
  highlight,
  className,
  children,
  style,
}: GradientCoverProps) {
  const background = artworkUrl ? `center / cover no-repeat url(${artworkUrl})` : gradient;
  return (
    <div
      className={cn(styles.cover, className)}
      style={{ width, height, borderRadius: radius, background, ...style }}
    >
      {highlight && <div className={styles.highlight} />}
      {children}
    </div>
  );
}
