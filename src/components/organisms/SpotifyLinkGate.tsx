import { Icon } from '~components/atoms/Icon';
import { useMusicAuth } from '~music/useMusicAuth';

/**
 * Blocking overlay shown on arrival when the music account isn't linked yet.
 * It cannot be dismissed — linking (or a provider that needs no link) is the
 * only way past it.
 */
export const SpotifyLinkGate = () => {
  const auth = useMusicAuth();

  if (!auth.capabilities.needsAccountLink || auth.linked) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(4,6,8,0.78)] p-6 backdrop-blur-[6px]">
      <div className="w-[420px] max-w-full rounded-[18px] border border-line-12 bg-screen p-7 text-center shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
          <Icon name="music_note" size={28} className="text-accent" />
        </div>
        <h2 className="m-0 text-[19px] font-extrabold tracking-[-0.02em]">
          Connect {auth.providerName}
        </h2>
        <p className="mx-auto mt-2 max-w-[320px] text-[13.5px] leading-relaxed text-muted-2">
          Sign in to {auth.providerName} to search and play music.
          {auth.capabilities.requiresPremium &&
            ` A ${auth.providerName} Premium account is required for playback.`}
        </p>
        <button
          type="button"
          className="mt-5 w-full rounded-sm border border-accent/45 bg-accent/16 px-4 py-2.5 text-[14px] font-semibold text-accent cursor-pointer transition-colors duration-150 hover:bg-accent/24"
          onClick={() => void auth.login()}
        >
          Sign in with {auth.providerName}
        </button>
      </div>
    </div>
  );
};
