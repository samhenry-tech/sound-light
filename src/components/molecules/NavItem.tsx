import { clsx } from 'clsx';

import { Icon } from '~components/atoms/Icon';

interface NavItemProps {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const BASE =
  'flex flex-col items-center justify-center gap-[5px] w-[62px] h-[60px] border-none rounded-[15px] cursor-pointer text-[10.5px] font-semibold transition-[background-color,color] duration-150 max-sm:h-12 max-sm:w-14 max-sm:gap-0.5 max-sm:rounded-[12px] max-sm:text-[10px]';

/** A vertical icon + label button in the left nav rail. */
export const NavItem = ({ icon, label, active, onClick }: NavItemProps) => {
  return (
    <button
      type="button"
      className={clsx(BASE, active ? 'bg-accent/15 text-accent' : 'bg-transparent text-muted-2')}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      <Icon name={icon} size={23} />
      <span>{label}</span>
    </button>
  );
};
