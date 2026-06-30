import { Icon } from '~components/atoms/Icon';

import styles from './FeedbackButtons.module.css';

/** 👍 — mark the current track a good fit for this mix. */
export function LikeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className={styles.round}
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
    <div className={styles.thumbDownWrap}>
      {holding && <span className={styles.hint}>release: fade · keep holding: banish</span>}
      <button
        type="button"
        className={styles.thumbDown}
        title="Doesn't fit — tap to fade & skip, hold to banish"
        aria-label="Doesn't fit — tap to skip, hold to banish"
        onPointerDown={(e) => {
          e.preventDefault();
          onHoldStart();
        }}
        onPointerUp={onHoldEnd}
        onPointerLeave={onHoldCancel}
      >
        <span className={styles.fill} style={{ height: holding ? '100%' : '0%' }} />
        <Icon name="thumb_down" size={25} className={styles.thumbIcon} />
      </button>
    </div>
  );
}
