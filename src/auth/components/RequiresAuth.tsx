import { LoginPage } from '~auth/components/LoginPage';
import { useAuthSession } from '~auth/useAuthSession';
import { Splash } from '~components/pages/Splash';

export const RequiresAuth = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthSession();
  if (isLoading) return <Splash title="Loading…" />;
  if (!isAuthenticated) return <LoginPage />;
  return children;
};
