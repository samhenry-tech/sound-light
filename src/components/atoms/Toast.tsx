/** The transient pill message shown above the now-playing bar. */
export function Toast({ message }: { message: string }) {
  return (
    <div
      className="animate-[risein_0.18s_ease-out] whitespace-nowrap rounded-pill border border-line-12 bg-surface-toast px-4 py-[9px] text-[13.5px] font-medium text-soft shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
