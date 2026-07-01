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
      className="flex h-[var(--play-btn)] w-[var(--play-btn)] flex-shrink-0 items-center justify-center rounded-pill border-none bg-accent cursor-pointer disabled:opacity-55 disabled:cursor-default"
      aria-label={isPlaying ? 'Pause' : 'Play'}
      onClick={onClick}
      disabled={disabled}
    >
      {isPlaying ? (
        <span className="flex gap-[5px]">
          <span className="h-5 w-[5px] rounded-[2px] bg-[#0c0e0f]" />
          <span className="h-5 w-[5px] rounded-[2px] bg-[#0c0e0f]" />
        </span>
      ) : (
        <span className="ml-1 h-0 w-0 border-l-[16px] border-l-[#0c0e0f] border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent" />
      )}
    </button>
  );
}
