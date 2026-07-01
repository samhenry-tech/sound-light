import { useAuthSession } from '~auth/useAuthSession';
import { Icon } from '~components/atoms/Icon';

/** Small multicolor Google "G". */
function GoogleG() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

/** Sign-in gate shown when Cognito is configured and the user is signed out. */
export function LoginPage() {
  const { login, loginWithGoogle, error } = useAuthSession();

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
          className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-md border-none bg-white p-[13px] font-[inherit] text-[14px] font-bold text-[#1a1a1a]"
          onClick={loginWithGoogle}
        >
          <GoogleG />
          Continue with Google
        </button>
        <button
          type="button"
          className="mt-3 w-full cursor-pointer rounded-md border border-line-12 bg-transparent p-3 font-[inherit] text-[13.5px] font-semibold text-quiet"
          onClick={login}
        >
          Sign in another way
        </button>

        {error && <p className="mt-4 text-[12.5px] text-danger-text-2">{error}</p>}
      </div>
    </div>
  );
}
