import type { ReactNode } from 'react';

import { Toast } from '~components/atoms/Toast';
import { NavRail, type Screen } from '~components/organisms/NavRail';
import { NowPlayingBar } from '~components/organisms/NowPlayingBar';
import { useUiStore } from '~stores/uiStore';

interface AppShellProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
  onOpenPalette: () => void;
  onOpenSettings: () => void;
  children: ReactNode;
}

/**
 * Default responsive app frame: left rail + routed content + the persistent
 * now-playing bar (rendered outside the route so music never stops on nav).
 * Fills the viewport on every device. On phones the rail becomes a bottom bar
 * under the now-playing strip.
 */
export const AppShell = ({
  active,
  onNavigate,
  onOpenPalette,
  onOpenSettings,
  children,
}: AppShellProps) => {
  const toast = useUiStore((s) => s.toast);

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-screen text-primary max-sm:flex-col sm:flex-row">
      <NavRail
        active={active}
        onNavigate={onNavigate}
        onOpenPalette={onOpenPalette}
        onOpenSettings={onOpenSettings}
      />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col max-sm:order-first">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
        <NowPlayingBar />
        {toast && (
          <div className="absolute bottom-[calc(var(--bar-h)+12px)] left-1/2 z-40 -translate-x-1/2 max-sm:w-[calc(100%-24px)] max-sm:max-w-md">
            <Toast message={toast} />
          </div>
        )}
      </div>
    </div>
  );
};
