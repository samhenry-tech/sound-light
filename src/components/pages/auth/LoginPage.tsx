import { useCallback } from 'react';

import { useAuthSession } from '~auth/useAuthSession';
import { Icon } from '~components/atoms/Icon';
import { APP_NAME } from '~constants';

/**
 * Sign-in gate. Renders the official Google Identity Services button, which
 * returns an ID token straight to the browser (no secret, no redirect) that we
 * exchange with the Cognito Identity Pool.
 */
export const LoginPage = () => {
  const { renderGoogleButton, beginGoogleLogin, error } = useAuthSession();

  const buttonRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) renderGoogleButton(node);
    },
    [renderGoogleButton],
  );

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-6"
      style={{
        background:
          'radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 60%), var(--color-app)',
      }}
    >
      <div className="w-[380px] max-w-full rounded-screen border border-line-08 bg-screen p-[40px_36px] text-center shadow-[0_40px_90px_rgba(0,0,0,0.55)]">
        <div className="mx-auto mb-[18px] flex h-[54px] w-[54px] items-center justify-center rounded-2xl bg-accent">
          <Icon name="graphic_eq" size={30} className="text-[#0c0e0f]" />
        </div>
        <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.02em]">{APP_NAME}</h1>
        <p className="mx-0 mt-2 mb-7 text-[14px] leading-[1.5] text-muted">
          The music companion for your table. Sign in to sync your mixes across devices.
        </p>

        <div ref={buttonRef} className="flex justify-center" />

        <button
          type="button"
          className="mt-3 cursor-pointer text-[12.5px] text-muted underline-offset-2 hover:underline"
          onClick={() => void beginGoogleLogin()}
        >
          Having trouble? Sign in with Google
        </button>

        {error && <p className="mt-4 text-[12.5px] text-danger-text-2">{error}</p>}
      </div>
    </div>
  );
};
