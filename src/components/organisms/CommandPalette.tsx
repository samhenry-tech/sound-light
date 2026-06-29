import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/atoms';
import { Modal } from '@/components/molecules';
import { useMixes } from '@/api';
import { usePlayerActions } from '@/features/player';
import { useUiStore } from '@/stores/uiStore';
import { mixName } from '@/lib/format';
import styles from './CommandPalette.module.css';

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  run: () => void;
}

/** ⌘K command palette — jump to any mix or run an action. */
export function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen);
  const setOpen = useUiStore((s) => s.setPaletteOpen);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const toggleTableMode = useUiStore((s) => s.toggleTableMode);
  const { data: mixes = [] } = useMixes();
  const actions = usePlayerActions();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  const items = useMemo<Command[]>(() => {
    const commands: Command[] = [
      { id: 'panic', label: 'Panic — jump to combat', icon: 'bolt', run: actions.panic },
      { id: 'table', label: 'Toggle table mode', icon: 'crop_free', run: toggleTableMode },
      { id: 'settings', label: 'Open settings', icon: 'tune', run: () => setSettingsOpen(true) },
    ];
    const mixCommands: Command[] = mixes.map((m) => ({
      id: `mix:${m.id}`,
      label: mixName(m.location, m.atmosphere),
      hint: 'Play',
      icon: 'play_arrow',
      run: () => {
        void actions.selectMix(m);
        void navigate('/live');
      },
    }));
    const all = [...commands, ...mixCommands];
    const q = query.trim().toLowerCase();
    return q ? all.filter((i) => i.label.toLowerCase().includes(q)) : all;
  }, [mixes, query, actions, navigate, setSettingsOpen, toggleTableMode]);

  const run = (cmd: Command) => {
    cmd.run();
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      const cmd = items[active];
      if (cmd) run(cmd);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      ariaLabel="Command palette"
      width={580}
      align="top"
    >
      <div className={styles.search}>
        <Icon name="search" size={20} className={styles.searchIcon} />
        <input
          autoFocus
          className={styles.input}
          placeholder="Jump to a mix or run a command…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        <kbd className={styles.kbd}>esc</kbd>
      </div>
      <div className={styles.list}>
        {items.map((cmd, i) => (
          <button
            key={cmd.id}
            type="button"
            className={cn(styles.item, i === active && styles.activeItem)}
            onMouseEnter={() => setActive(i)}
            onClick={() => run(cmd)}
          >
            <Icon name={cmd.icon} size={18} className={styles.itemIcon} />
            <span className={styles.itemLabel}>{cmd.label}</span>
            {cmd.hint && <span className={styles.itemHint}>{cmd.hint}</span>}
          </button>
        ))}
        {items.length === 0 && <div className={styles.noResults}>No matches.</div>}
      </div>
    </Modal>
  );
}
