interface EqBarsProps {
  /** Total height of the bars in px. */
  size?: number;
  color?: string;
}

const BAR = 'h-full w-[3px] origin-bottom animate-eq rounded-[2px]';

/** Three animated equalizer bars — the "this mix is playing" indicator. */
export const EqBars = ({ size = 14, color = 'var(--accent)' }: EqBarsProps) => {
  return (
    <span
      className="flex flex-shrink-0 items-end gap-[3px]"
      style={{ height: size }}
      aria-hidden="true"
    >
      <span className={BAR} style={{ background: color }} />
      <span className={BAR} style={{ background: color, animationDelay: '0.25s' }} />
      <span className={BAR} style={{ background: color, animationDelay: '0.45s' }} />
    </span>
  );
};
