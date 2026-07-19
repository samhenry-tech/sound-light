import { type ReactNode, useEffect } from 'react';

import { DEFAULT_ACCENT } from '~theme/atmosphere';

/** Applies the fixed app accent to the `--accent` CSS variable. */
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', DEFAULT_ACCENT);
  }, []);

  return <>{children}</>;
};
