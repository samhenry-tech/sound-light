export interface BanishedTrackData {
  uri: string;
  title: string;
  artist: string;
  origin: string;
}

interface BanishedPanelProps {
  tracks: BanishedTrackData[];
  onRestore: (uri: string) => void;
}

/** Red-tinted panel listing banished tracks, each with Restore. */
export function BanishedPanel({ tracks, onRestore }: BanishedPanelProps) {
  return (
    <div className="mt-[18px] rounded-[14px] border border-danger-18 bg-danger-06 px-4 py-3.5">
      <div className="mb-2.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-danger-text-3">
        Banished — won't play in this mix
      </div>
      {tracks.map((t) => (
        <div key={t.uri} className="flex items-center gap-[13px] px-1 py-2">
          <span className="flex min-w-0 flex-1 flex-col gap-px">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-semibold text-icon-muted line-through">
              {t.title}
            </span>
            <span className="text-[11.5px] text-muted-2">
              {t.artist} · {t.origin}
            </span>
          </span>
          <button
            type="button"
            className="flex-shrink-0 rounded-[8px] border border-line-14 bg-transparent px-[13px] py-1.5 text-[12px] font-semibold text-quiet cursor-pointer"
            onClick={() => onRestore(t.uri)}
          >
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}
