import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useMusicProvider } from '~music/MusicProviderContext';

import { Splash } from './Splash';

/** Music-provider (Spotify) OAuth redirect target. Completes the token exchange. */
export function MusicCallbackPage() {
  const provider = useMusicProvider();
  const navigate = useNavigate();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    provider.auth
      .completeLogin(params)
      .then(() => navigate('/library', { replace: true }))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : `${provider.name} link failed.`),
      );
  }, [provider, navigate]);

  return <Splash title={`Linking ${provider.name}…`} error={error} />;
}
