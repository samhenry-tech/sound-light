import styles from './Toast.module.css';

/** The transient pill message shown above the now-playing bar. */
export function Toast({ message }: { message: string }) {
  return (
    <div className={styles.toast} role="status" aria-live="polite">
      {message}
    </div>
  );
}
