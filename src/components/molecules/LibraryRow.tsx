import { clsx } from 'clsx';

import { GradientCover } from '~components/atoms/GradientCover';

interface LibraryRowProps {
  name: string;
  meta: string;
  gradient: string;
  artworkUrl?: string;
  selected: boolean;
  onSelect: () => void;
}

const BASE =
  'flex w-full items-center gap-3 text-left px-[11px] py-[9px] rounded-md cursor-pointer text-primary border';

/** A playlist row in the Library master list. */
export const LibraryRow = ({
  name,
  meta,
  gradient,
  artworkUrl,
  selected,
  onSelect,
}: LibraryRowProps) => {
  return (
    <button
      type="button"
      className={clsx(
        BASE,
        selected
          ? 'bg-surface-selected border-line-12'
          : 'bg-transparent border-transparent hover:bg-[rgba(255,255,255,0.025)]',
      )}
      aria-current={selected}
      onClick={onSelect}
    >
      <GradientCover
        gradient={gradient}
        artworkUrl={artworkUrl}
        width={40}
        height={40}
        radius={10}
      />
      <span className="flex flex-1 flex-col gap-0.5 min-w-0">
        <span className="truncate text-[14px] font-semibold">{name}</span>
        <span className="truncate text-[11px] text-muted-2">{meta}</span>
      </span>
    </button>
  );
};
