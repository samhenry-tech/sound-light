import { clsx } from 'clsx';
import type { ReactNode } from 'react';

import { useUpdateUserSettings, useUserSettings } from '~api/hooks';
import { Icon } from '~components/atoms/Icon';
import { Modal } from '~components/molecules/Modal';
import { Select } from '~components/molecules/Select';
import { usePlayerActions } from '~features/player/PlayerContext';
import { useMusicAuth } from '~music/useMusicAuth';
import { usePlayerStore } from '~stores/playerStore';
import { AMBIENT_KINDS, type AmbientKind, useSettingsStore } from '~stores/settingsStore';
import { useUiStore } from '~stores/uiStore';
import { ACCENT_OPTIONS, capitalize } from '~theme/atmosphere';
const ROW = 'flex min-h-[38px] items-center justify-between gap-4';
const LABEL = 'text-[14px] text-quiet';
const SEG_BTN = 'border-none px-3 py-1.5 text-[13px] font-semibold rounded-[7px] cursor-pointer';
const SEG_ACTIVE = 'bg-accent/18 text-accent';
const SEG_INACTIVE = 'bg-transparent text-muted';
const SEGMENT = 'flex gap-1 rounded-sm border border-line-10 bg-surface-control p-[3px]';
const SLIDER_ROW = 'flex items-center gap-3';
const VALUE = 'min-w-[36px] text-right text-[13px] tabular-nums text-muted';
const PRIMARY_BTN =
  'rounded-sm border border-accent/45 bg-accent/16 px-3.5 py-2 text-[13px] font-semibold text-accent cursor-pointer';
const DANGER_BTN =
  'rounded-sm border border-danger-30 bg-danger-12 px-3.5 py-2 text-[13px] font-semibold text-danger-text cursor-pointer';

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
  ['T', 'Table mode'],
  ['⌘K', 'Command palette'],
];

/** The settings modal — theming, playback, ambient, account, shortcuts. */
export const SettingsPanel = () => {
  const open = useUiStore((s) => s.settingsOpen);
  const setOpen = useUiStore((s) => s.setSettingsOpen);

  const { data: userSettings } = useUserSettings();
  const updateUserSettings = useUpdateUserSettings();
  const auth = useMusicAuth();
  const actions = usePlayerActions();

  const settings = useSettingsStore();
  const history = usePlayerStore((s) => s.history);
  const sleepEndsAt = usePlayerStore((s) => s.sleepEndsAt);

  const accent = userSettings?.accent ?? ACCENT_OPTIONS[0];
  const columns = userSettings?.columns ?? 5;
  const cardLabel = userSettings?.cardLabel ?? 'split';

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
        <Section title="Appearance">
          <div className={ROW}>
            <span className={LABEL}>Accent</span>
            <div className="flex gap-2.5">
              {ACCENT_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={clsx(
                    'h-[26px] w-[26px] rounded-full border-2 cursor-pointer',
                    accent === c
                      ? 'border-primary shadow-[0_0_0_2px_var(--color-screen)]'
                      : 'border-transparent',
                  )}
                  style={{ background: c }}
                  aria-label={`Accent ${c}`}
                  aria-pressed={accent === c}
                  onClick={() => updateUserSettings.mutate({ accent: c })}
                />
              ))}
            </div>
          </div>
          <div className={ROW}>
            <span className={LABEL}>Grid density</span>
            <div className={SEGMENT}>
              {[4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={clsx(SEG_BTN, columns === n ? SEG_ACTIVE : SEG_INACTIVE)}
                  onClick={() => updateUserSettings.mutate({ columns: n })}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className={ROW}>
            <span className={LABEL}>Card label</span>
            <div className={SEGMENT}>
              {(['split', 'combined'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={clsx(SEG_BTN, cardLabel === v ? SEG_ACTIVE : SEG_INACTIVE)}
                  onClick={() => updateUserSettings.mutate({ cardLabel: v })}
                >
                  {capitalize(v)}
                </button>
              ))}
            </div>
          </div>
        </Section>

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

        <Section title="Ambient bed">
          <div className={ROW}>
            <span className={LABEL}>Sound</span>
            <div className={SEGMENT}>
              <button
                type="button"
                className={clsx(SEG_BTN, settings.ambientKind === null ? SEG_ACTIVE : SEG_INACTIVE)}
                onClick={() => settings.setAmbientKind(null)}
              >
                Off
              </button>
              {AMBIENT_KINDS.map((k: AmbientKind) => (
                <button
                  key={k}
                  type="button"
                  className={clsx(SEG_BTN, settings.ambientKind === k ? SEG_ACTIVE : SEG_INACTIVE)}
                  onClick={() => settings.setAmbientKind(k)}
                >
                  {capitalize(k)}
                </button>
              ))}
            </div>
          </div>
          <div className={ROW}>
            <span className={LABEL}>Ambient volume</span>
            <div className={SLIDER_ROW}>
              <input
                type="range"
                className="w-[160px] accent-accent"
                min={0}
                max={1}
                step={0.05}
                value={settings.ambientVolume}
                onChange={(e) => settings.setAmbientVolume(Number(e.target.value))}
              />
              <span className={VALUE}>{Math.round(settings.ambientVolume * 100)}%</span>
            </div>
          </div>
        </Section>

        <Section title="Sleep timer">
          <div className={ROW}>
            <span className={LABEL}>Fade out after</span>
            {sleepEndsAt ? (
              <button type="button" className={DANGER_BTN} onClick={actions.cancelSleepTimer}>
                Cancel timer
              </button>
            ) : (
              <div className={SLIDER_ROW}>
                <Select
                  ariaLabel="Sleep timer minutes"
                  value={String(settings.sleepTimerMinutes)}
                  onChange={(v) => settings.setSleepTimerMinutes(Number(v))}
                  options={[15, 30, 45, 60, 90, 120].map((n) => ({
                    value: String(n),
                    label: `${n} min`,
                  }))}
                />
                <button
                  type="button"
                  className={PRIMARY_BTN}
                  onClick={() => actions.startSleepTimer(settings.sleepTimerMinutes)}
                >
                  Start
                </button>
              </div>
            )}
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

        <Section title="Keyboard">
          <div className={ROW}>
            <span className={LABEL}>Shortcuts</span>
            <button
              type="button"
              className={clsx(SEG_BTN, settings.keyboardEnabled ? SEG_ACTIVE : SEG_INACTIVE)}
              onClick={() => settings.setKeyboardEnabled(!settings.keyboardEnabled)}
            >
              {settings.keyboardEnabled ? 'On' : 'Off'}
            </button>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-x-[18px] gap-y-2">
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
