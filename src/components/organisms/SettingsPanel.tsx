import { type ReactNode, useState } from 'react';

import { useDefaultPlaylists, usePutDefaultPlaylist } from '~/api/hooks';
import { useAuthSession } from '~/auth/useAuthSession';
import { Icon } from '~/components/atoms/Icon';
import { Spinner } from '~/components/atoms/Spinner';
import { Modal } from '~/components/molecules/Modal';
import { appConfig } from '~/config';
import { populateDefaultPlaylists } from '~/features/defaults/populateDefaultPlaylists';
import { DEFAULTS_ADMIN_EMAIL } from '~/models/defaultPlaylists';
import { useMusicProvider } from '~/music-providers/MusicProviderContext';
import { useMusicAuth } from '~/music-providers/useMusicAuth';
import { usePlayerStore } from '~/stores/playerStore';
import { useSettingsStore } from '~/stores/settingsStore';
import { useUiStore } from '~/stores/uiStore';

const ROW = 'flex min-h-[38px] items-center justify-between gap-4';
const LABEL = 'text-[14px] text-quiet';
const SLIDER_ROW = 'flex items-center gap-3';
const VALUE = 'min-w-[36px] text-right text-[13px] tabular-nums text-muted';
const PRIMARY_BTN =
  'rounded-sm border border-accent/45 bg-accent/16 px-3.5 py-2 text-[13px] font-semibold text-accent cursor-pointer disabled:cursor-default disabled:opacity-50';
const DANGER_BTN =
  'rounded-sm border border-danger-30 bg-danger-12 px-3.5 py-2 text-[13px] font-semibold text-danger-text cursor-pointer';
const MONO = 'break-all font-mono text-[11.5px] text-muted';

const Section = ({ title, children }: { title: string; children: ReactNode }) => {
  return (
    <section className="border-b border-line-05 py-4">
      <h3 className="mb-3 text-[11.5px] font-bold uppercase tracking-[0.14em] text-faint">
        {title}
      </h3>
      {children}
    </section>
  );
};

const SHORTCUTS: [string, string][] = [
  ['Space', 'Play / pause'],
  ['→ / N', 'Next track'],
  ['B', 'Banish current'],
  ['L', 'Good fit'],
  ['M', 'Mute'],
  ['↑ / ↓', 'Volume'],
  ['⌘K', 'Command palette'],
];

/** The settings modal — theming, playback, ambient, account, shortcuts. */
export const SettingsPanel = () => {
  const open = useUiStore((s) => s.settingsOpen);
  const setOpen = useUiStore((s) => s.setSettingsOpen);
  const showToast = useUiStore((s) => s.showToast);

  const auth = useMusicAuth();
  const session = useAuthSession();
  const provider = useMusicProvider();
  const putDefault = usePutDefaultPlaylist();
  const { data: defaults = [] } = useDefaultPlaylists();

  const settings = useSettingsStore();
  const history = usePlayerStore((s) => s.history);

  const [populateLabel, setPopulateLabel] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isAdmin =
    (session.user?.email ?? '').toLowerCase() === DEFAULTS_ADMIN_EMAIL.toLowerCase() ||
    (session.user?.email ?? '').toLowerCase() === appConfig.defaultsAdminEmail.toLowerCase();

  const onCopyOwner = async () => {
    try {
      await navigator.clipboard.writeText(session.owner);
      setCopied(true);
      showToast('Cognito identity id copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Couldn’t copy — select the id manually');
    }
  };

  const onPopulate = () => {
    if (!auth.linked) {
      showToast(`Link ${auth.providerName} first`);
      return;
    }
    if (!appConfig.defaultsAdminIdentityId) {
      showToast('Add your Cognito id to config/shared.json first (see below)');
      return;
    }
    setPopulateLabel('Starting…');
    void populateDefaultPlaylists(
      provider,
      (playlist) => putDefault.mutateAsync(playlist),
      (progress) => {
        setPopulateLabel(`${progress.index + 1}/${progress.total} · ${progress.label}`);
      },
    )
      .then((result) => {
        const short = result.shortfall.length > 0 ? ` (${result.shortfall.length} under ~4h)` : '';
        showToast(`Published ${result.playlists.length} default playlists${short}`);
      })
      .catch((err: unknown) => {
        showToast(err instanceof Error ? err.message : 'Populate failed');
      })
      .finally(() => setPopulateLabel(null));
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} ariaLabel="Settings" width={620}>
      <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-line-08 bg-screen px-[22px] py-[18px]">
        <h2 className="m-0 text-[19px] font-extrabold tracking-[-0.02em]">Settings</h2>
        <button
          type="button"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-xs border-none bg-transparent text-icon-muted cursor-pointer"
          aria-label="Close settings"
          onClick={() => setOpen(false)}
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      <div className="px-[22px] pb-[22px] pt-2">
        <Section title="Playback">
          <div className={ROW}>
            <span className={LABEL}>Crossfade</span>
            <div className={SLIDER_ROW}>
              <input
                type="range"
                className="w-[160px] accent-accent"
                min={0}
                max={8000}
                step={500}
                value={settings.crossfadeMs}
                onChange={(e) => settings.setCrossfadeMs(Number(e.target.value))}
              />
              <span className={VALUE}>{(settings.crossfadeMs / 1000).toFixed(1)}s</span>
            </div>
          </div>
        </Section>

        <Section title={`Music — ${auth.providerName}`}>
          <div className={ROW}>
            <span className={LABEL}>Account</span>
            {auth.capabilities.needsAccountLink ? (
              auth.linked ? (
                <button type="button" className={DANGER_BTN} onClick={auth.logout}>
                  Unlink {auth.providerName}
                </button>
              ) : (
                <button type="button" className={PRIMARY_BTN} onClick={auth.login}>
                  Link {auth.providerName}
                </button>
              )
            ) : (
              <span className="text-[12.5px] text-muted-2">
                No account needed for {auth.providerName}.
              </span>
            )}
          </div>
          {auth.capabilities.requiresPremium && (
            <p className="mt-2 text-[12px] text-muted-2">
              Playback requires {auth.providerName} Premium.
            </p>
          )}
        </Section>

        {isAdmin && (
          <Section title="Default genre packs">
            <div className="flex flex-col gap-3">
              <div>
                <div className="mb-1 text-[12px] text-muted-2">Your Cognito identity id</div>
                <div className="flex items-start gap-2">
                  <code className={MONO}>{session.owner || '—'}</code>
                  <button type="button" className={PRIMARY_BTN} onClick={() => void onCopyOwner()}>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="mt-2 mb-0 text-[12px] leading-relaxed text-muted-2">
                  Paste into <code className="text-quiet">config/shared.json</code> as{' '}
                  <code className="text-quiet">defaultsAdminIdentityId</code>, merge, and wait for
                  Terraform to apply before publishing.
                  {appConfig.defaultsAdminIdentityId
                    ? appConfig.defaultsAdminIdentityId === session.owner
                      ? ' Identity id matches config.'
                      : ' Configured id differs from this session.'
                    : ' Not set in config yet.'}
                </p>
              </div>
              <div className={ROW}>
                <span className={LABEL}>
                  Catalog
                  <span className="mt-0.5 block text-[11.5px] text-muted-2">
                    {defaults.length} playlists stored
                    {defaults.some((p) => p.trackUris.length > 0) ? ' · ready' : ' · empty'}
                  </span>
                </span>
                <button
                  type="button"
                  className={PRIMARY_BTN}
                  disabled={Boolean(populateLabel) || putDefault.isPending}
                  onClick={onPopulate}
                >
                  {populateLabel ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size={14} /> {populateLabel}
                    </span>
                  ) : (
                    'Populate from Spotify'
                  )}
                </button>
              </div>
            </div>
          </Section>
        )}

        <Section title="Keyboard">
          <div className="grid grid-cols-2 gap-x-[18px] gap-y-2">
            {SHORTCUTS.map(([key, desc]) => (
              <div key={key} className="flex items-center gap-2.5 text-[12.5px] text-muted">
                <kbd className="min-w-[28px] rounded-[5px] border border-line-12 px-[7px] py-0.5 text-center text-[10.5px] font-bold text-quiet">
                  {key}
                </kbd>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {history.length > 0 && (
          <Section title="Recently played">
            <div className="flex flex-col gap-2">
              {history.slice(0, 8).map((h, i) => (
                <div key={`${h.track.uri}-${i}`} className="flex flex-col gap-px">
                  <span className="text-[13.5px] font-semibold">{h.track.title}</span>
                  <span className="text-[11.5px] text-muted-2">
                    {h.track.artist} · {h.playlistName}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </Modal>
  );
};
