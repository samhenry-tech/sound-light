import { useEffect } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';
import { usePlayerActions } from './PlayerContext';

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable
  );
}

const VOLUME_STEP = 0.05;

/** Global keyboard shortcuts for hands-on play. Mounted once inside the gate. */
export function useKeyboardShortcuts() {
  const actions = usePlayerActions();
  const enabled = useSettingsStore((s) => s.keyboardEnabled);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ui = useUiStore.getState();
      // ⌘K / Ctrl+K toggles the command palette even from inputs.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        ui.togglePalette();
        return;
      }
      if (!enabled || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          actions.togglePlay();
          break;
        case 'ArrowRight':
        case 'n':
          actions.next();
          break;
        case 'b':
          actions.banish();
          break;
        case 'p':
          actions.panic();
          break;
        case 'l':
          actions.like();
          break;
        case 'm':
          actions.toggleMute();
          break;
        case 't':
          ui.toggleTableMode();
          break;
        case 'ArrowUp':
          e.preventDefault();
          actions.setVolume(Math.min(1, usePlayerStore.getState().volume + VOLUME_STEP));
          break;
        case 'ArrowDown':
          e.preventDefault();
          actions.setVolume(Math.max(0, usePlayerStore.getState().volume - VOLUME_STEP));
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [actions, enabled]);
}
