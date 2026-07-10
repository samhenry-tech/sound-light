import { clsx } from 'clsx';
import { type ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  width?: number;
  /** Align panel to the top (command palette) vs. center (settings). */
  align?: 'top' | 'center';
  children: ReactNode;
}

const BACKDROP =
  'fixed inset-0 z-[80] flex justify-center bg-[rgba(4,6,8,0.6)] backdrop-blur-[4px] p-6 animate-[risein_0.16s_ease-out]';

/** Accessible overlay dialog with Escape + backdrop dismissal. */
export const Modal = ({
  open,
  onClose,
  ariaLabel,
  width = 560,
  align = 'center',
  children,
}: ModalProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={clsx(BACKDROP, align === 'top' ? 'items-start pt-[12vh]' : 'items-center')}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div
        className="max-w-full max-h-[84vh] overflow-y-auto bg-screen border border-line-12 rounded-[18px] shadow-[0_30px_80px_rgba(0,0,0,0.6)] animate-[pop_0.16s_ease-out]"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
