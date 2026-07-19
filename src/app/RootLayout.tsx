import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { CommandPalette } from '~components/organisms/CommandPalette';
import type { Screen } from '~components/organisms/NavRail';
import { SettingsPanel } from '~components/organisms/SettingsPanel';
import { AppShell } from '~components/templates/AppShell';
import { TabletShell } from '~components/templates/TabletShell';
import { useKeyboardShortcuts } from '~features/player/useKeyboardShortcuts';
import { useUiStore } from '~stores/uiStore';

/** Auth gate + app shell that wraps the Home / Library routes. */
export const RootLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const tabletMode = useUiStore((s) => s.tabletMode);
  useKeyboardShortcuts();

  const active: Screen = location.pathname.startsWith('/library') ? 'library' : 'home';

  // Dev-only tablet mode swaps the fixed iPad canvas for a plain full-viewport
  // layout; production always uses the app shell.
  const Shell = import.meta.env.DEV && tabletMode ? TabletShell : AppShell;

  return (
    <>
      <Shell
        active={active}
        onNavigate={(screen) => navigate(`/${screen}`)}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      >
        <Outlet />
      </Shell>
      <CommandPalette />
      <SettingsPanel />
    </>
  );
};
