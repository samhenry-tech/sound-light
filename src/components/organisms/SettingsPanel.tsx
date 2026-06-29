import type { ReactNode } from 'react';
import { useMixes, usePrefs, useUpdatePrefs } from '@/api';
import { Icon } from '@/components/atoms';
import { Modal, Select } from '@/components/molecules';
import { useMusicAuth } from '@/music';
import { usePlayerActions } from '@/features/player';
import { usePlayerStore } from '@/stores/playerStore';
import { AMBIENT_KINDS, useSettingsStore, type AmbientKind } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';
import { ACCENT_OPTIONS, capitalize } from '@/theme/atmosphere';
import { mixName } from '@/lib/format';
import { cn } from '@/lib/cn';
import styles from './SettingsPanel.module.css';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </section>
  );
}

const SHORTCUTS: [string, string][] = [
  ['Space', 'Play / pause'],
  ['→ / N', 'Next track'],
  ['B', 'Banish current'],
  ['P', 'Panic → combat'],
  ['L', 'Good fit'],
  ['M', 'Mute'],
  ['↑ / ↓', 'Volume'],
  ['T', 'Table mode'],
  ['⌘K', 'Command palette'],
];

/** The settings modal — theming, playback, ambient, account, shortcuts. */
export function SettingsPanel() {
  const open = useUiStore((s) => s.settingsOpen);
  const setOpen = useUiStore((s) => s.setSettingsOpen);

  const { data: prefs } = usePrefs();
  const updatePrefs = useUpdatePrefs();
  const { data: mixes = [] } = useMixes();
  const auth = useMusicAuth();
  const actions = usePlayerActions();

  const settings = useSettingsStore();
  const history = usePlayerStore((s) => s.history);
  const sleepEndsAt = usePlayerStore((s) => s.sleepEndsAt);

  const accent = prefs?.accent ?? ACCENT_OPTIONS[0];
  const columns = prefs?.columns ?? 5;
  const cardLabel = prefs?.cardLabel ?? 'split';

  return (
    <Modal open={open} onClose={() => setOpen(false)} ariaLabel="Settings" width={620}>
      <div className={styles.header}>
        <h2 className={styles.title}>Settings</h2>
        <button
          type="button"
          className={styles.close}
          aria-label="Close settings"
          onClick={() => setOpen(false)}
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      <div className={styles.body}>
        <Section title="Appearance">
          <div className={styles.row}>
            <span className={styles.label}>Accent</span>
            <div className={styles.swatches}>
              {ACCENT_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(styles.swatch, accent === c && styles.swatchActive)}
                  style={{ background: c }}
                  aria-label={`Accent ${c}`}
                  aria-pressed={accent === c}
                  onClick={() => updatePrefs.mutate({ accent: c })}
                />
              ))}
            </div>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Grid density</span>
            <div className={styles.segment}>
              {[4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={cn(styles.segBtn, columns === n && styles.segActive)}
                  onClick={() => updatePrefs.mutate({ columns: n })}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Card label</span>
            <div className={styles.segment}>
              {(['split', 'combined'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={cn(styles.segBtn, cardLabel === v && styles.segActive)}
                  onClick={() => updatePrefs.mutate({ cardLabel: v })}
                >
                  {capitalize(v)}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Playback">
          <div className={styles.row}>
            <span className={styles.label}>Crossfade</span>
            <div className={styles.sliderRow}>
              <input
                type="range"
                min={0}
                max={8000}
                step={500}
                value={settings.crossfadeMs}
                onChange={(e) => settings.setCrossfadeMs(Number(e.target.value))}
              />
              <span className={styles.value}>{(settings.crossfadeMs / 1000).toFixed(1)}s</span>
            </div>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Panic target</span>
            <Select
              ariaLabel="Panic target mix"
              value={settings.panicMixId ?? ''}
              onChange={(v) => settings.setPanicMixId(v || null)}
              options={[
                { value: '', label: 'Auto (first combat mix)' },
                ...mixes.map((m) => ({ value: m.id, label: mixName(m.location, m.atmosphere) })),
              ]}
            />
          </div>
        </Section>

        <Section title="Ambient bed">
          <div className={styles.row}>
            <span className={styles.label}>Sound</span>
            <div className={styles.segment}>
              <button
                type="button"
                className={cn(styles.segBtn, settings.ambientKind === null && styles.segActive)}
                onClick={() => settings.setAmbientKind(null)}
              >
                Off
              </button>
              {AMBIENT_KINDS.map((k: AmbientKind) => (
                <button
                  key={k}
                  type="button"
                  className={cn(styles.segBtn, settings.ambientKind === k && styles.segActive)}
                  onClick={() => settings.setAmbientKind(k)}
                >
                  {capitalize(k)}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Ambient volume</span>
            <div className={styles.sliderRow}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.ambientVolume}
                onChange={(e) => settings.setAmbientVolume(Number(e.target.value))}
              />
              <span className={styles.value}>{Math.round(settings.ambientVolume * 100)}%</span>
            </div>
          </div>
        </Section>

        <Section title="Sleep timer">
          <div className={styles.row}>
            <span className={styles.label}>Fade out after</span>
            {sleepEndsAt ? (
              <button type="button" className={styles.dangerBtn} onClick={actions.cancelSleepTimer}>
                Cancel timer
              </button>
            ) : (
              <div className={styles.sliderRow}>
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
                  className={styles.primaryBtn}
                  onClick={() => actions.startSleepTimer(settings.sleepTimerMinutes)}
                >
                  Start
                </button>
              </div>
            )}
          </div>
        </Section>

        <Section title={`Music — ${auth.providerName}`}>
          <div className={styles.row}>
            <span className={styles.label}>Account</span>
            {auth.capabilities.needsAccountLink ? (
              auth.linked ? (
                <button type="button" className={styles.dangerBtn} onClick={auth.logout}>
                  Unlink {auth.providerName}
                </button>
              ) : (
                <button type="button" className={styles.primaryBtn} onClick={auth.login}>
                  Link {auth.providerName}
                </button>
              )
            ) : (
              <span className={styles.note}>Demo mode — bundled catalog, no account needed</span>
            )}
          </div>
          {auth.capabilities.requiresPremium && (
            <p className={styles.hint}>Playback requires {auth.providerName} Premium.</p>
          )}
        </Section>

        <Section title="Keyboard">
          <div className={styles.row}>
            <span className={styles.label}>Shortcuts</span>
            <button
              type="button"
              className={cn(styles.segBtn, settings.keyboardEnabled && styles.segActive)}
              onClick={() => settings.setKeyboardEnabled(!settings.keyboardEnabled)}
            >
              {settings.keyboardEnabled ? 'On' : 'Off'}
            </button>
          </div>
          <div className={styles.shortcuts}>
            {SHORTCUTS.map(([key, desc]) => (
              <div key={key} className={styles.shortcut}>
                <kbd className={styles.kbd}>{key}</kbd>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {history.length > 0 && (
          <Section title="Recently played">
            <div className={styles.history}>
              {history.slice(0, 8).map((h, i) => (
                <div key={`${h.track.uri}-${i}`} className={styles.historyRow}>
                  <span className={styles.historyTitle}>{h.track.title}</span>
                  <span className={styles.historySub}>
                    {h.track.artist} · {h.mixName}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </Modal>
  );
}
