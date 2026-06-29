/** Ephemeral UI state (search queries, filters, selection, toast, modes). */
import { create } from 'zustand';
import type { Atmosphere } from '@/theme/atmosphere';

export type AtmosphereFilter = 'all' | Atmosphere;

let toastTimer: ReturnType<typeof setTimeout> | undefined;

interface UiState {
  /** Live screen */
  liveQuery: string;
  liveFilter: AtmosphereFilter;

  /** Library screen */
  libQuery: string;
  libSelectedId: string | null;
  editorQuery: string;
  showBanished: boolean;

  /** App modes */
  tableMode: boolean;
  paletteOpen: boolean;
  settingsOpen: boolean;

  toast: string | null;

  setLiveQuery: (q: string) => void;
  setLiveFilter: (f: AtmosphereFilter) => void;
  setLibQuery: (q: string) => void;
  selectLibrary: (id: string) => void;
  setEditorQuery: (q: string) => void;
  clearEditorQuery: () => void;
  toggleBanished: () => void;
  setTableMode: (on: boolean) => void;
  toggleTableMode: () => void;
  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
  setSettingsOpen: (open: boolean) => void;
  showToast: (message: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  liveQuery: '',
  liveFilter: 'all',
  libQuery: '',
  libSelectedId: null,
  editorQuery: '',
  showBanished: false,
  tableMode: false,
  paletteOpen: false,
  settingsOpen: false,
  toast: null,

  setLiveQuery: (liveQuery) => set({ liveQuery }),
  setLiveFilter: (liveFilter) => set({ liveFilter }),
  setLibQuery: (libQuery) => set({ libQuery }),
  // Selecting a mix resets the editor (matches the prototype's libSelect).
  selectLibrary: (libSelectedId) => set({ libSelectedId, editorQuery: '', showBanished: false }),
  setEditorQuery: (editorQuery) => set({ editorQuery }),
  clearEditorQuery: () => set({ editorQuery: '' }),
  toggleBanished: () => set((s) => ({ showBanished: !s.showBanished })),
  setTableMode: (tableMode) => set({ tableMode }),
  toggleTableMode: () => set((s) => ({ tableMode: !s.tableMode })),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  showToast: (message) => {
    clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), 2200);
  },
}));
