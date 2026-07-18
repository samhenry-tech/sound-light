export const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="shrink-0 rounded-[6px] border border-line-12 px-[7px] py-[3px] text-[10px] font-bold uppercase tracking-[0.06em] text-muted">
    {children}
  </span>
);
