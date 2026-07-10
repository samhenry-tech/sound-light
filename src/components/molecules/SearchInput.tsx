import { clsx } from 'clsx';

import { Icon } from '~components/atoms/Icon';

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

const INPUT_BASE =
  'w-full border text-primary text-[14px] outline-none transition-[border-color] duration-150 placeholder:text-muted-2 focus:border-accent';

const TONES: Record<NonNullable<SearchInputProps['tone']>, string> = {
  card: 'bg-surface-card border-line-10 rounded-sm px-3.5 py-2.5',
  control: 'bg-surface-control-alt border-line-12 rounded-md px-3.5 py-3',
};

/** A themed text input with optional leading icon and clear button. */
export const SearchInput = ({
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
}: SearchInputProps) => {
  const showClear = clearable && value.length > 0;
  return (
    <div className={clsx('relative flex items-center', className)}>
      {leadingIcon && (
        <Icon
          name={leadingIcon}
          size={20}
          className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-muted-2"
        />
      )}
      <input
        className={clsx(INPUT_BASE, TONES[tone])}
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
          className="absolute right-[9px] top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg border-none bg-transparent text-icon-muted cursor-pointer"
          aria-label="Clear"
          onClick={() => (onClear ? onClear() : onChange(''))}
        >
          <Icon name="close" size={18} />
        </button>
      )}
    </div>
  );
};
