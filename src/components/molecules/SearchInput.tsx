import { Icon } from '~components/atoms/Icon';
import { cn } from '~lib/cn';

import styles from './SearchInput.module.css';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Leading Material Symbols glyph (e.g. "search"). */
  leadingIcon?: string;
  /** Show a clear ✕ when there's a value. */
  clearable?: boolean;
  onClear?: () => void;
  tone?: 'card' | 'control';
  ariaLabel?: string;
  className?: string;
  autoFocus?: boolean;
}

/** A themed text input with optional leading icon and clear button. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  leadingIcon,
  clearable,
  onClear,
  tone = 'card',
  ariaLabel,
  className,
  autoFocus,
}: SearchInputProps) {
  const showClear = clearable && value.length > 0;
  return (
    <div className={cn(styles.field, className)}>
      {leadingIcon && <Icon name={leadingIcon} size={20} className={styles.leading} />}
      <input
        className={cn(styles.input, styles[tone])}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        style={{
          paddingLeft: leadingIcon ? 42 : undefined,
          paddingRight: showClear ? 40 : undefined,
        }}
      />
      {showClear && (
        <button
          type="button"
          className={styles.clear}
          aria-label="Clear"
          onClick={() => (onClear ? onClear() : onChange(''))}
        >
          <Icon name="close" size={18} />
        </button>
      )}
    </div>
  );
}
