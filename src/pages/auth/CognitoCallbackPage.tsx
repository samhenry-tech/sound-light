import { useAuthSession } from '@/auth';
import { Splash } from './Splash';

/**
 * Cognito redirect target. `react-oidc-context` processes the code/state at the
 * provider level and then rewrites the URL to "/"; this page just shows status.
 */
export function CognitoCallbackPage() {
  const { error } = useAuthSession();
  return <Splash title="Signing you in…" error={error} />;
}
