import { clsx } from 'clsx';

import { useAuthSession } from '~auth/useAuthSession';
import { Icon } from '~components/atoms/Icon';
import { NavItem } from '~components/molecules/NavItem';
import { APP_NAME } from '~constants';
import { useUiStore } from '~stores/uiStore';

export type Screen = 'home' | 'library';

interface NavRailProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
  onOpenPalette: () => void;
  onOpenSettings: () => void;
}

const TOOL =
  'flex h-11 w-11 items-center justify-center rounded-[13px] border-none bg-transparent text-muted-2 cursor-pointer transition-colors duration-150 hover:text-quiet max-sm:h-10 max-sm:w-10';

/** Left rail (desktop/tablet) / bottom bar (phone): mark, nav, and quick tools. */
export const NavRail = ({ active, onNavigate, onOpenPalette, onOpenSettings }: NavRailProps) => {
  const { logout } = useAuthSession();
  const tabletMode = useUiStore((s) => s.tabletMode);
  const toggleTabletMode = useUiStore((s) => s.toggleTabletMode);

  return (
    <nav
      className="flex w-[var(--rail-w)] flex-shrink-0 flex-col items-center gap-2 border-r border-line-07 bg-rail py-4 max-sm:h-[var(--rail-mobile-h)] max-sm:w-full max-sm:flex-row max-sm:justify-between max-sm:gap-1 max-sm:border-r-0 max-sm:border-t max-sm:px-3 max-sm:py-1.5"
      aria-label="Primary"
    >
      <div className="mb-3 flex flex-col items-center gap-1.5 max-sm:mb-0 max-sm:hidden">
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-accent">
          <Icon name="graphic_eq" size={22} className="text-[#0c0e0f]" />
        </div>
        <span className="whitespace-nowrap text-[9.5px] font-bold tracking-[-0.01em] text-quiet">
          {APP_NAME}
        </span>
      </div>

      <div className="flex flex-col items-center gap-2 max-sm:flex-row max-sm:gap-1">
        <NavItem
          icon="graphic_eq"
          label="Home"
          active={active === 'home'}
          onClick={() => onNavigate('home')}
        />
        <NavItem
          icon="library_music"
          label="Library"
          active={active === 'library'}
          onClick={() => onNavigate('library')}
        />
      </div>

      <div className="flex-1 max-sm:hidden" />

      <div className="flex flex-col items-center gap-1.5 max-sm:flex-row max-sm:gap-0.5">
        <button
          type="button"
          className={TOOL}
          title="Command palette (⌘K)"
          aria-label="Open command palette"
          onClick={onOpenPalette}
        >
          <Icon name="search" size={22} />
        </button>
        {import.meta.env.DEV && (
          <button
            type="button"
            className={clsx(TOOL, tabletMode && 'bg-accent/15 text-accent hover:text-accent')}
            title="iPad canvas preview (dev)"
            aria-label="Toggle iPad canvas preview"
            aria-pressed={tabletMode}
            onClick={toggleTabletMode}
          >
            <Icon name="tablet_mac" size={22} />
          </button>
        )}
        <button
          type="button"
          className={TOOL}
          title="Settings"
          aria-label="Open settings"
          onClick={onOpenSettings}
        >
          <Icon name="settings" size={22} />
        </button>
        <button
          type="button"
          className={TOOL}
          title="Log out"
          aria-label="Log out"
          onClick={() => void logout()}
        >
          <Icon name="logout" size={22} />
        </button>
      </div>
    </nav>
  );
};
