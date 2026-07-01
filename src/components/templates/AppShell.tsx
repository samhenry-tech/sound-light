import type { ReactNode } from 'react';

import { Toast } from '~components/atoms/Toast';
import { NavRail, type Screen } from '~components/organisms/NavRail';
import { NowPlayingBar } from '~components/organisms/NowPlayingBar';
import { cn } from '~lib/cn';
import { useUiStore } from '~stores/uiStore';

import { useCanvasScale } from './useCanvasScale';

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
export function AppShell({
  active,
  onNavigate,
  onOpenPalette,
  onOpenSettings,
  children,
}: AppShellProps) {
  const tableMode = useUiStore((s) => s.tableMode);
  const toggleTableMode = useUiStore((s) => s.toggleTableMode);
  const toast = useUiStore((s) => s.toast);
  const scale = useCanvasScale(tableMode ? 0 : 24);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-app">
      <div
        className={cn(
          'relative flex w-[var(--canvas-w)] h-[var(--canvas-h)] flex-shrink-0 flex-col overflow-hidden bg-screen text-primary',
          tableMode
            ? 'rounded-none shadow-none'
            : 'rounded-screen shadow-[0_40px_90px_rgba(0,0,0,0.55)]',
        )}
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        <div className="flex min-h-0 flex-1">
          <NavRail
            active={active}
            onNavigate={onNavigate}
            tableMode={tableMode}
            onToggleTable={toggleTableMode}
            onOpenPalette={onOpenPalette}
            onOpenSettings={onOpenSettings}
          />
          <div className="relative flex min-w-0 flex-1 flex-col">{children}</div>
        </div>

        <NowPlayingBar />

        {toast && (
          <div className="absolute bottom-[112px] left-1/2 z-40 -translate-x-1/2">
            <Toast message={toast} />
          </div>
        )}
      </div>
    </div>
  );
}
