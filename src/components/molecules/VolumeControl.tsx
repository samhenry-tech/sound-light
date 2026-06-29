import { Icon } from '@/components/atoms';
import styles from './VolumeControl.module.css';

interface VolumeControlProps {
  volume: number;
  muted: boolean;
  onChange: (volume: number) => void;
  onToggleMute: () => void;
}

function volumeIcon(volume: number, muted: boolean): string {
  if (muted || volume === 0) return 'volume_off';
  if (volume < 0.5) return 'volume_down';
  return 'volume_up';
}

/** Mute toggle + volume slider. */
export function VolumeControl({ volume, muted, onChange, onToggleMute }: VolumeControlProps) {
  const value = muted ? 0 : volume;
  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.muteBtn}
        aria-label={muted ? 'Unmute' : 'Mute'}
        onClick={onToggleMute}
      >
        <Icon name={volumeIcon(volume, muted)} size={20} />
      </button>
      <input
        className={styles.slider}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        aria-label="Volume"
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--pct' as string]: `${value * 100}%` }}
      />
    </div>
  );
}
