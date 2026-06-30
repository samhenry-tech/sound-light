import type { ButtonHTMLAttributes } from 'react';

import { cn } from '~lib/cn';

import { Icon } from './Icon';
import styles from './IconButton.module.css';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  /** Box size in px. */
  size?: number;
  iconSize?: number;
  variant?: 'default' | 'danger' | 'ghost';
  /** Required for a11y since the button is icon-only. */
  label: string;
}

/** A square, hairline-bordered icon button (remove ✕, delete, close). */
export function IconButton({
  icon,
  size = 34,
  iconSize = 18,
  variant = 'default',
  label,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(styles.btn, styles[variant], className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}
