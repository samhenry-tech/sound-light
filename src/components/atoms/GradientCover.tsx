import { clsx } from 'clsx';
import type { CSSProperties, ReactNode } from 'react';

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
export const GradientCover = ({
  gradient,
  artworkUrl,
  width = '100%',
  height,
  radius,
  highlight,
  className,
  children,
  style,
}: GradientCoverProps) => {
  const background = artworkUrl ? `center / cover no-repeat url(${artworkUrl})` : gradient;
  return (
    <div
      className={clsx('relative flex-shrink-0 overflow-hidden', className)}
      style={{ width, height, borderRadius: radius, background, ...style }}
    >
      {highlight && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_70%_at_30%_24%,rgba(255,255,255,0.14),transparent_65%)]" />
      )}
      {children}
    </div>
  );
};
