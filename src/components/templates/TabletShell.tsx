import type { ReactNode } from 'react';

import { Toast } from '~components/atoms/Toast';
import { NavRail, type Screen } from '~components/organisms/NavRail';
import { NowPlayingBar } from '~components/organisms/NowPlayingBar';
import { useUiStore } from '~stores/uiStore';

interface TabletShellProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
  onOpenPalette: () => void;
  onOpenSettings: () => void;
  children: ReactNode;
}

/**
 * Dev-only simplified shell: skips the fixed 1194×834 iPad canvas and just
 * fills the viewport with a plain Tailwind layout (rail + content + bar).
 */
export const TabletShell = ({
  active,
  onNavigate,
  onOpenPalette,
  onOpenSettings,
  children,
}: TabletShellProps) => {
  const toast = useUiStore((s) => s.toast);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-screen text-primary">
      <div className="flex min-h-0 flex-1">
        <NavRail
          active={active}
          onNavigate={onNavigate}
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
  );
};
