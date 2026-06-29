import styles from './BanishedPanel.module.css';

export interface BanishedTrackData {
  uri: string;
  title: string;
  artist: string;
  origin: string;
}

interface BanishedPanelProps {
  tracks: BanishedTrackData[];
  onRestore: (uri: string) => void;
}

/** Red-tinted panel listing banished tracks, each with Restore. */
export function BanishedPanel({ tracks, onRestore }: BanishedPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.label}>Banished — won't play in this mix</div>
      {tracks.map((t) => (
        <div key={t.uri} className={styles.row}>
          <span className={styles.meta}>
            <span className={styles.title}>{t.title}</span>
            <span className={styles.sub}>
              {t.artist} · {t.origin}
            </span>
          </span>
          <button type="button" className={styles.restore} onClick={() => onRestore(t.uri)}>
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}
