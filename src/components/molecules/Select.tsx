import { Icon } from '~components/atoms/Icon';

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
export const Select = ({ value, options, onChange, ariaLabel }: SelectProps) => {
  return (
    <span className="relative inline-flex items-center">
      <select
        className="appearance-none bg-surface-control-alt border border-line-12 rounded-sm text-primary text-[13.5px] font-semibold pl-3 pr-7 py-[7px] cursor-pointer focus:outline-none focus:border-accent"
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
      <Icon
        name="expand_more"
        size={18}
        className="pointer-events-none absolute right-2 text-icon-muted"
      />
    </span>
  );
};
