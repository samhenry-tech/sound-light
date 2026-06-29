import { cn } from '@/lib/cn';
import { Icon } from '@/components/atoms';
import styles from './NavItem.module.css';

interface NavItemProps {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

/** A vertical icon + label button in the left nav rail. */
export function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      className={cn(styles.item, active && styles.active)}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      <Icon name={icon} size={23} />
      <span>{label}</span>
    </button>
  );
}
