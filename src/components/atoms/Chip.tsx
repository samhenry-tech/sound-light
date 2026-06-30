import type { ButtonHTMLAttributes } from 'react';

import { cn } from '~lib/cn';

import styles from './Chip.module.css';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/** A pill filter/toggle chip (atmosphere filters). */
export function Chip({ active, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(styles.chip, active && styles.active, className)}
      {...props}
    />
  );
}
