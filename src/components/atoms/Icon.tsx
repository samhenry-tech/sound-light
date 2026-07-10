import { clsx } from 'clsx';
import type { CSSProperties } from 'react';

interface IconProps {
  /** Material Symbols Rounded glyph name, e.g. "graphic_eq". */
  name: string;
  size?: number;
  filled?: boolean;
  weight?: number;
  className?: string;
  style?: CSSProperties;
}

/** A Material Symbols Rounded glyph. Decorative by default (aria-hidden). */
export const Icon = ({ name, size = 20, filled, weight, className, style }: IconProps) => {
  const variation =
    filled || weight ? `'FILL' ${filled ? 1 : 0}, 'wght' ${weight ?? 400}` : undefined;
  return (
    <span
      className={clsx('material-symbol', className)}
      aria-hidden="true"
      style={{ fontSize: size, fontVariationSettings: variation, ...style }}
    >
      {name}
    </span>
  );
};
