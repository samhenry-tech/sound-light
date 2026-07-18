import { useShallow } from 'zustand/react/shallow';

import { EqBars } from '~components/atoms/EqBars';
import { GradientCover } from '~components/atoms/GradientCover';
import { LikeButton, ThumbDownButton } from '~components/molecules/FeedbackButtons';
import { PlayButton } from '~components/molecules/PlayButton';
import { ProgressBar } from '~components/molecules/ProgressBar';
import { VolumeControl } from '~components/molecules/VolumeControl';
import { APP_NAME } from '~constants';
import { usePlayerActions } from '~features/player/PlayerContext';
import { usePlayerStore } from '~stores/playerStore';

const FALLBACK_COVER = 'linear-gradient(150deg,#1a1f20,#0f1213)';

/** The persistent now-playing bar. Connected to the player store + actions. */
export const NowPlayingBar = () => {
  const state = usePlayerStore(
    useShallow((s) => ({
      current: s.current,
      isPlaying: s.isPlaying,
      positionMs: s.positionMs,
      durationMs: s.durationMs,
      playlistName: s.playlistName,
      coverBg: s.coverBg,
      holding: s.holding,
      volume: s.volume,
      muted: s.muted,
    })),
  );
  const actions = usePlayerActions();
  const hasTrack = Boolean(state.current);

  return (
    <div className="relative flex h-[var(--bar-h)] flex-shrink-0 items-center gap-[18px] border-t border-line-08 bg-bar px-[22px]">
      <GradientCover
        className="border border-line-08"
        gradient={state.coverBg || FALLBACK_COVER}
        artworkUrl={state.current?.artworkUrl}
        width={58}
        height={58}
        radius={12}
        highlight
      />
      {hasTrack && state.isPlaying && <EqBars size={14} />}

      <div className="w-[248px] min-w-0 flex-shrink-0">
        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[17px] font-bold tracking-[-0.01em]">
          {state.playlistName || APP_NAME}
        </div>
        <div className="mt-px overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] text-muted">
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

      <div className="h-11 w-px flex-shrink-0 bg-line-08" />

      <div className="flex flex-shrink-0 items-center gap-3">
        <PlayButton isPlaying={state.isPlaying} onClick={actions.togglePlay} disabled={!hasTrack} />
        <div className="mx-0.5 h-[30px] w-px flex-shrink-0 bg-line-08" />
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
};
