import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { AppLayout } from '~/components/layouts/AppLayout';
import { TabletLayout } from '~/components/layouts/TabletLayout';
import { CommandPalette } from '~/components/organisms/CommandPalette';
import type { Screen } from '~/components/organisms/NavRail';
import { SettingsPanel } from '~/components/organisms/SettingsPanel';
import { SpotifyLinkGate } from '~/components/organisms/SpotifyLinkGate';
import { useKeyboardShortcuts } from '~/features/player/useKeyboardShortcuts';
import { useUiStore } from '~/stores/uiStore';

/** Auth gate + app shell that wraps the Home / Library routes. */
export const RootLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const tabletMode = useUiStore((s) => s.tabletMode);
  useKeyboardShortcuts();

  const active: Screen = location.pathname.startsWith('/library') ? 'library' : 'home';

  // Responsive full-viewport shell by default. Dev-only tablet mode previews
  // the fixed 1194×834 iPad canvas.
  const Layout = import.meta.env.DEV && tabletMode ? TabletLayout : AppLayout;

  return (
    <>
      <Layout
        active={active}
        onNavigate={(screen) => navigate(`/${screen}`)}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      >
        <Outlet />
      </Layout>
      <CommandPalette />
      <SettingsPanel />
      <SpotifyLinkGate />
    </>
  );
};
