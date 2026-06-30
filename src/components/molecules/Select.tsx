import { Icon } from '~components/atoms/Icon';

import styles from './Select.module.css';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
}

/** A themed wrapper around a native <select> (location / atmosphere). */
export function Select({ value, options, onChange, ariaLabel }: SelectProps) {
  return (
    <span className={styles.wrap}>
      <select
        className={styles.select}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="expand_more" size={18} className={styles.chevron} />
    </span>
  );
}
