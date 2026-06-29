import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Toast } from '@/components/atoms';
import { NavRail, NowPlayingBar, type Screen } from '@/components/organisms';
import { useUiStore } from '@/stores/uiStore';
import { useCanvasScale } from './useCanvasScale';
import styles from './AppShell.module.css';

interface AppShellProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
  onOpenPalette: () => void;
  onOpenSettings: () => void;
  children: ReactNode;
}

/**
 * The iPad-canvas app frame: left rail + routed content + the persistent
 * now-playing bar (rendered outside the route so music never stops on nav).
 */
export function AppShell({ active, onNavigate, onOpenPalette, onOpenSettings, children }: AppShellProps) {
  const tableMode = useUiStore((s) => s.tableMode);
  const toggleTableMode = useUiStore((s) => s.toggleTableMode);
  const toast = useUiStore((s) => s.toast);
  const scale = useCanvasScale(tableMode ? 0 : 24);

  return (
    <div className={styles.stage}>
      <div className={cn(styles.frame, tableMode && styles.tableFrame)} style={{ transform: `scale(${scale})` }}>
        <div className={styles.bodyRow}>
          <NavRail
            active={active}
            onNavigate={onNavigate}
            tableMode={tableMode}
            onToggleTable={toggleTableMode}
            onOpenPalette={onOpenPalette}
            onOpenSettings={onOpenSettings}
          />
          <div className={styles.content}>{children}</div>
        </div>

        <NowPlayingBar />

        {toast && (
          <div className={styles.toastWrap}>
            <Toast message={toast} />
          </div>
        )}
      </div>
    </div>
  );
}
