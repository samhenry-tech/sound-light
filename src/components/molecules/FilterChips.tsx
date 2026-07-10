import { Chip } from '~components/atoms/Chip';
import type { AtmosphereFilter } from '~stores/uiStore';
import { ATMOSPHERES, capitalize } from '~theme/atmosphere';

const FILTERS: { value: AtmosphereFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...ATMOSPHERES.map((a) => ({ value: a, label: capitalize(a) })),
];

interface FilterChipsProps {
  value: AtmosphereFilter;
  onChange: (value: AtmosphereFilter) => void;
}

/** Horizontal scroll row of atmosphere filter chips. */
export const FilterChips = ({ value, onChange }: FilterChipsProps) => {
  return (
    <div
      className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Filter by atmosphere"
    >
      {FILTERS.map((f) => (
        <Chip key={f.value} active={value === f.value} onClick={() => onChange(f.value)}>
          {f.label}
        </Chip>
      ))}
    </div>
  );
};
