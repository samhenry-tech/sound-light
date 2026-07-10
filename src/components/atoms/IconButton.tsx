import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

import { Icon } from './Icon';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  /** Box size in px. */
  size?: number;
  iconSize?: number;
  variant?: 'default' | 'danger' | 'ghost';
  /** Required for a11y since the button is icon-only. */
  label: string;
}

const BASE =
  'flex flex-shrink-0 items-center justify-center rounded-xs border bg-transparent cursor-pointer transition-colors duration-150';

const VARIANTS: Record<NonNullable<IconButtonProps['variant']>, string> = {
  default: 'border-line-10 text-icon-muted hover:border-line-20',
  danger: 'border-danger-30 text-danger-text-2 hover:border-line-20',
  ghost: 'border-transparent text-icon-muted hover:border-line-20',
};

/** A square, hairline-bordered icon button (remove ✕, delete, close). */
export const IconButton = ({
  icon,
  size = 34,
  iconSize = 18,
  variant = 'default',
  label,
  className,
  ...props
}: IconButtonProps) => {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={clsx(BASE, VARIANTS[variant], className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
};
