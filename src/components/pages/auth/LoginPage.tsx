import { useAuthSession } from '~auth/useAuthSession';
import { Icon } from '~components/atoms/Icon';

/**
 * Sign-in gate. Redirects to Google OAuth (authorization code + PKCE) so a
 * refresh token can be issued and persisted for silent session renewal.
 */
export const LoginPage = () => {
  const { beginGoogleLogin, error } = useAuthSession();

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

        <button
          type="button"
          className="inline-flex h-11 w-full max-w-[300px] cursor-pointer items-center justify-center gap-2 rounded-md border border-line-12 bg-[#131314] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#1f1f20]"
          onClick={() => void beginGoogleLogin()}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#FFC107"
              d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
              fill="#FF3D00"
              d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
          </svg>
          Continue with Google
        </button>

        {error && <p className="mt-4 text-[12.5px] text-danger-text-2">{error}</p>}
      </div>
    </div>
  );
};
