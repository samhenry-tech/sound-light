import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthSession } from '@/auth';
import { CommandPalette, SettingsPanel, type Screen } from '@/components/organisms';
import { AppShell } from '@/components/templates';
import { useKeyboardShortcuts } from '@/features/player/useKeyboardShortcuts';
import { LoginPage } from '@/pages/auth/LoginPage';
import { Splash } from '@/pages/auth/Splash';
import { useUiStore } from '@/stores/uiStore';

/** Auth gate + app shell that wraps the Live / Library routes. */
export function RootLayout() {
  const session = useAuthSession();
  const location = useLocation();
  const navigate = useNavigate();
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  useKeyboardShortcuts();

  if (session.isLoading) return <Splash title="Loading…" />;
  if (session.enabled && !session.isAuthenticated) return <LoginPage />;

  const active: Screen = location.pathname.startsWith('/library') ? 'library' : 'live';

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
}
