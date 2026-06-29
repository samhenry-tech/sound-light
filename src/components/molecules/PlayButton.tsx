import styles from './PlayButton.module.css';

interface PlayButtonProps {
  isPlaying: boolean;
  onClick: () => void;
  disabled?: boolean;
}

/** The large round accent play/pause button. */
export function PlayButton({ isPlaying, onClick, disabled }: PlayButtonProps) {
  return (
    <button
      type="button"
      className={styles.btn}
      aria-label={isPlaying ? 'Pause' : 'Play'}
      onClick={onClick}
      disabled={disabled}
    >
      {isPlaying ? (
        <span className={styles.pause}>
          <span className={styles.bar} />
          <span className={styles.bar} />
        </span>
      ) : (
        <span className={styles.triangle} />
      )}
    </button>
  );
}
