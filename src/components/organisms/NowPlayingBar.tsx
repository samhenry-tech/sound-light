import { useShallow } from 'zustand/react/shallow';

import { EqBars } from '~components/atoms/EqBars';
import { GradientCover } from '~components/atoms/GradientCover';
import { LikeButton, ThumbDownButton } from '~components/molecules/FeedbackButtons';
import { PlayButton } from '~components/molecules/PlayButton';
import { ProgressBar } from '~components/molecules/ProgressBar';
import { VolumeControl } from '~components/molecules/VolumeControl';
import { usePlayerActions } from '~features/player/PlayerContext';
import { usePlayerStore } from '~stores/playerStore';

import styles from './NowPlayingBar.module.css';

const FALLBACK_COVER = 'linear-gradient(150deg,#1a1f20,#0f1213)';

/** The persistent now-playing bar. Connected to the player store + actions. */
export function NowPlayingBar() {
  const state = usePlayerStore(
    useShallow((s) => ({
      current: s.current,
      isPlaying: s.isPlaying,
      positionMs: s.positionMs,
      durationMs: s.durationMs,
      mixName: s.mixName,
      coverBg: s.coverBg,
      holding: s.holding,
      volume: s.volume,
      muted: s.muted,
    })),
  );
  const actions = usePlayerActions();
  const hasTrack = Boolean(state.current);

  return (
    <div className={styles.bar}>
      <GradientCover
        className={styles.cover}
        gradient={state.coverBg || FALLBACK_COVER}
        artworkUrl={state.current?.artworkUrl}
        width={58}
        height={58}
        radius={12}
        highlight
      />
      {hasTrack && state.isPlaying && <EqBars size={14} />}

      <div className={styles.text}>
        <div className={styles.name}>{state.mixName || 'atmos'}</div>
        <div className={styles.sub}>
          {state.current
            ? `${state.current.title} · ${state.current.artist}`
            : 'Tap a vibe to begin'}
        </div>
      </div>

      <ProgressBar
        positionMs={state.positionMs}
        durationMs={state.durationMs}
        onSeek={actions.seek}
      />

      <VolumeControl
        volume={state.volume}
        muted={state.muted}
        onChange={actions.setVolume}
        onToggleMute={actions.toggleMute}
      />

      <div className={styles.divider} />

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.panic}
          onClick={actions.panic}
          title="Panic → jump to combat"
        >
          PANIC
        </button>
        <PlayButton isPlaying={state.isPlaying} onClick={actions.togglePlay} disabled={!hasTrack} />
        <div className={styles.smallDivider} />
        <LikeButton onClick={actions.like} />
        <ThumbDownButton
          holding={state.holding}
          onHoldStart={actions.startHold}
          onHoldEnd={actions.endHold}
          onHoldCancel={actions.cancelHold}
        />
      </div>
    </div>
  );
}
