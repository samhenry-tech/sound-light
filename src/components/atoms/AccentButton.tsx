import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

import { Icon } from './Icon';

interface AccentButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
}

/** Accent-tinted action button (New, Add). */
export const AccentButton = ({ icon, children, className, ...props }: AccentButtonProps) => {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-accent/45 bg-accent/16 px-[13px] py-2 text-[13px] font-semibold text-accent disabled:cursor-default disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
};
