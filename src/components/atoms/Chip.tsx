import type { ButtonHTMLAttributes } from 'react';

import { cn } from '~lib/cn';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

const BASE =
  'flex items-center whitespace-nowrap rounded-pill border bg-transparent px-[15px] py-2 text-[13px] font-semibold cursor-pointer transition-[border-color] duration-150';

/** A pill filter/toggle chip (atmosphere filters). */
export function Chip({ active, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        BASE,
        active ? 'border-accent/50 bg-accent/15 text-accent' : 'border-line-10 text-muted-3',
        className,
      )}
      {...props}
    />
  );
}
