import { Spinner } from '@/components/atoms';
import styles from './Splash.module.css';

/** Full-screen centered spinner / message used during auth redirects. */
export function Splash({ title, error }: { title: string; error?: string }) {
  return (
    <div className={styles.splash}>
      {!error && <Spinner size={26} />}
      <div className={error ? styles.error : styles.title}>{error ?? title}</div>
    </div>
  );
}
