import { Icon } from '~components/atoms/Icon';

/** 👍 — mark the current track a good fit for this mix. */
export function LikeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex h-[var(--thumb-btn)] w-[var(--thumb-btn)] flex-shrink-0 items-center justify-center rounded-pill border border-line-12 bg-surface-control text-icon-muted cursor-pointer"
      title="Good fit for this mix"
      aria-label="Good fit — keep this track"
      onClick={onClick}
    >
      <Icon name="thumb_up" size={25} />
    </button>
  );
}

interface ThumbDownButtonProps {
  holding: boolean;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  onHoldCancel: () => void;
}

/**
 * 👎 — tap to fade & skip, press-and-hold to banish. While held, a red ring
 * charges bottom-up and a hint floats above (matching the prototype exactly).
 */
export function ThumbDownButton({
  holding,
  onHoldStart,
  onHoldEnd,
  onHoldCancel,
}: ThumbDownButtonProps) {
  return (
    <div className="relative">
      {holding && (
        <span className="absolute bottom-[62px] right-0 whitespace-nowrap rounded-lg border border-line-12 bg-surface-control px-2.5 py-1.5 text-[11px] text-quiet shadow-[0_8px_20px_rgba(0,0,0,0.5)] animate-[risein_0.16s_ease-out]">
          release: fade · keep holding: banish
        </span>
      )}
      <button
        type="button"
        className="relative flex h-[var(--thumb-btn)] w-[var(--thumb-btn)] flex-shrink-0 items-center justify-center overflow-hidden rounded-pill border border-danger-30 bg-surface-control text-danger-text cursor-pointer touch-none"
        title="Doesn't fit — tap to fade & skip, hold to banish"
        aria-label="Doesn't fit — tap to skip, hold to banish"
        onPointerDown={(e) => {
          e.preventDefault();
          onHoldStart();
        }}
        onPointerUp={onHoldEnd}
        onPointerLeave={onHoldCancel}
      >
        <span
          className="absolute inset-x-0 bottom-0 bg-danger-42 transition-[height] duration-700 ease-linear"
          style={{ height: holding ? '100%' : '0%' }}
        />
        <Icon name="thumb_down" size={25} className="relative" />
      </button>
    </div>
  );
}
