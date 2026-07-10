import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';

import { useAuthSession } from '~auth/useAuthSession';
import { Icon } from '~components/atoms/Icon';

/**
 * Sign-in gate. Renders the official Sign in with Google button (GIS popup
 * mode) as the primary path, with a full-page redirect fallback for browsers
 * that block the popup.
 */
export const LoginPage = () => {
  const { loginWithGoogleCredential, loginWithGoogleRedirect, error } = useAuthSession();
  const [popupFailed, setPopupFailed] = useState(false);

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
        <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.02em]">atmos</h1>
        <p className="mx-0 mt-2 mb-7 text-[14px] leading-[1.5] text-muted">
          The music companion for your table. Sign in to sync your mixes across devices.
        </p>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(response) => {
              if (response.credential) {
                void loginWithGoogleCredential(response.credential);
              } else {
                setPopupFailed(true);
              }
            }}
            onError={() => setPopupFailed(true)}
            theme="filled_black"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="300"
          />
        </div>

        <button
          type="button"
          className="mt-4 w-full cursor-pointer border-none bg-transparent p-1 font-[inherit] text-[12.5px] font-semibold text-quiet underline-offset-2 hover:underline"
          onClick={loginWithGoogleRedirect}
        >
          {popupFailed
            ? 'Popup blocked? Sign in with a redirect instead'
            : 'Trouble with the popup? Use redirect sign-in'}
        </button>

        {error && <p className="mt-4 text-[12.5px] text-danger-text-2">{error}</p>}
      </div>
    </div>
  );
};
