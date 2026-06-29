import styles from './Badge.module.css';

/** Small uppercase tag — PLAYLIST / TRACK in search results. */
export function Badge({ children }: { children: React.ReactNode }) {
  return <span className={styles.badge}>{children}</span>;
}
