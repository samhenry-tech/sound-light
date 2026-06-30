import { type ReactNode,useEffect } from 'react';

import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  width?: number;
  /** Align panel to the top (command palette) vs. center (settings). */
  align?: 'top' | 'center';
  children: ReactNode;
}

/** Accessible overlay dialog with Escape + backdrop dismissal. */
export function Modal({
  open,
  onClose,
  ariaLabel,
  width = 560,
  align = 'center',
  children,
}: ModalProps) {
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
      className={`${styles.backdrop} ${align === 'top' ? styles.alignTop : styles.alignCenter}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div className={styles.panel} style={{ width }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
