import { type ReactNode,useEffect } from 'react';

import { usePrefs } from '~api/hooks';
import { DEFAULT_ACCENT } from '~theme/atmosphere';

/** Applies the user's accent preference to the `--accent` CSS variable. */
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { data: prefs } = usePrefs();
  const accent = prefs?.accent ?? DEFAULT_ACCENT;

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
  }, [accent]);

  return <>{children}</>;
};
