import { Icon } from '~components/atoms/Icon';

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

const THUMB =
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-none [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-none';

const SLIDER = `appearance-none w-[92px] h-1 rounded-pill cursor-pointer bg-[linear-gradient(to_right,var(--accent)_var(--pct,80%),rgba(255,255,255,0.1)_var(--pct,80%))] ${THUMB}`;

/** Mute toggle + volume slider. */
export function VolumeControl({ volume, muted, onChange, onToggleMute }: VolumeControlProps) {
  const value = muted ? 0 : volume;
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="flex h-[34px] w-[34px] items-center justify-center rounded-xs border-none bg-transparent text-icon-muted cursor-pointer"
        aria-label={muted ? 'Unmute' : 'Mute'}
        onClick={onToggleMute}
      >
        <Icon name={volumeIcon(volume, muted)} size={20} />
      </button>
      <input
        className={SLIDER}
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
