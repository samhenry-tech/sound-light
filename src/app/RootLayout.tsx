import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { CommandPalette } from '~components/organisms/CommandPalette';
import type { Screen } from '~components/organisms/NavRail';
import { SettingsPanel } from '~components/organisms/SettingsPanel';
import { AppShell } from '~components/templates/AppShell';
import { useKeyboardShortcuts } from '~features/player/useKeyboardShortcuts';
import { useUiStore } from '~stores/uiStore';

/** Auth gate + app shell that wraps the Live / Library routes. */
export const RootLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  useKeyboardShortcuts();


  const active: Screen = location.pathname.startsWith('/library') ? 'library' : 'home';

  return (
    <>
      <AppShell
        active={active}
        onNavigate={(screen) => navigate(`/${screen}`)}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      >
        <Outlet />
      </AppShell>
      <CommandPalette />
      <SettingsPanel />
    </>
  );
};
