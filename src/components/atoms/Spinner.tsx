export const Spinner = ({ size = 18 }: { size?: number }) => (
  <span
    className="inline-block animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-line-12 border-t-accent"
    style={{ width: size, height: size }}
    role="status"
    aria-label="Loading"
  />
);
