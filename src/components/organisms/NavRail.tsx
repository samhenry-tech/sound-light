import { cn } from '@/lib/cn';
import { Icon } from '@/components/atoms';
import { NavItem } from '@/components/molecules';
import styles from './NavRail.module.css';

export type Screen = 'live' | 'library';

interface NavRailProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
  tableMode: boolean;
  onToggleTable: () => void;
  onOpenPalette: () => void;
  onOpenSettings: () => void;
}

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
    <nav className={styles.rail} aria-label="Primary">
      <div className={styles.brand}>
        <div className={styles.mark}>
          <Icon name="graphic_eq" size={22} className={styles.markIcon} />
        </div>
        <span className={styles.brandName}>atmos</span>
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

      <div className={styles.spacer} />

      <div className={styles.tools}>
        <button
          type="button"
          className={styles.tool}
          title="Command palette (⌘K)"
          aria-label="Open command palette"
          onClick={onOpenPalette}
        >
          <Icon name="search" size={22} />
        </button>
        <button
          type="button"
          className={cn(styles.tool, tableMode && styles.activeTool)}
          title="Table mode"
          aria-label="Toggle table mode"
          aria-pressed={tableMode}
          onClick={onToggleTable}
        >
          <Icon name="crop_free" size={22} />
        </button>
        <button
          type="button"
          className={styles.tool}
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
