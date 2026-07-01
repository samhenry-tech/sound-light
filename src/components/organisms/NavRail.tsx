import { Icon } from '~components/atoms/Icon';
import { NavItem } from '~components/molecules/NavItem';
import { cn } from '~lib/cn';

export type Screen = 'live' | 'library';

interface NavRailProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
  tableMode: boolean;
  onToggleTable: () => void;
  onOpenPalette: () => void;
  onOpenSettings: () => void;
}

const TOOL =
  'flex h-11 w-11 items-center justify-center rounded-[13px] border-none bg-transparent text-muted-2 cursor-pointer transition-colors duration-150 hover:text-quiet';

/** Left rail: app mark, primary navigation, and quick tools. */
export function NavRail({
  active,
  onNavigate,
  tableMode,
  onToggleTable,
  onOpenPalette,
  onOpenSettings,
}: NavRailProps) {
  return (
    <nav
      className="flex w-[var(--rail-w)] flex-shrink-0 flex-col items-center gap-2 border-r border-line-07 bg-rail py-4"
      aria-label="Primary"
    >
      <div className="mb-3 flex flex-col items-center gap-1.5">
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-accent">
          <Icon name="graphic_eq" size={22} className="text-[#0c0e0f]" />
        </div>
        <span className="whitespace-nowrap text-[9.5px] font-bold tracking-[-0.01em] text-quiet">
          atmos
        </span>
      </div>

      <NavItem
        icon="graphic_eq"
        label="Live"
        active={active === 'live'}
        onClick={() => onNavigate('live')}
      />
      <NavItem
        icon="library_music"
        label="Library"
        active={active === 'library'}
        onClick={() => onNavigate('library')}
      />

      <div className="flex-1" />

      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          className={TOOL}
          title="Command palette (⌘K)"
          aria-label="Open command palette"
          onClick={onOpenPalette}
        >
          <Icon name="search" size={22} />
        </button>
        <button
          type="button"
          className={cn(TOOL, tableMode && 'bg-accent/15 text-accent hover:text-accent')}
          title="Table mode"
          aria-label="Toggle table mode"
          aria-pressed={tableMode}
          onClick={onToggleTable}
        >
          <Icon name="crop_free" size={22} />
        </button>
        <button
          type="button"
          className={TOOL}
          title="Settings"
          aria-label="Open settings"
          onClick={onOpenSettings}
        >
          <Icon name="tune" size={22} />
        </button>
      </div>
    </nav>
  );
}
