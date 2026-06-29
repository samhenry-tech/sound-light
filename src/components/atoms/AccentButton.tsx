import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';
import styles from './AccentButton.module.css';

interface AccentButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
}

/** Accent-tinted action button (New, Add). */
export function AccentButton({ icon, children, className, ...props }: AccentButtonProps) {
  return (
    <button type="button" className={cn(styles.btn, className)} {...props}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}
