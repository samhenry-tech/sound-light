import styles from './EqBars.module.css';

interface EqBarsProps {
  /** Total height of the bars in px. */
  size?: number;
  color?: string;
}

/** Three animated equalizer bars — the "this mix is playing" indicator. */
export function EqBars({ size = 14, color = 'var(--accent)' }: EqBarsProps) {
  return (
    <span className={styles.bars} style={{ height: size }} aria-hidden="true">
      <span className={styles.bar} style={{ background: color }} />
      <span className={styles.bar} style={{ background: color }} />
      <span className={styles.bar} style={{ background: color }} />
    </span>
  );
}
