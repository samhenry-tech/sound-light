import { clsx } from 'clsx';
import { type KeyboardEvent,useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useMixes } from '~api/hooks';
import { Icon } from '~components/atoms/Icon';
import { Modal } from '~components/molecules/Modal';
import { usePlayerActions } from '~features/player/PlayerContext';
import { mixName } from '~utils/formatUtils';
import { useUiStore } from '~stores/uiStore';

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  run: () => void;
}

/** ⌘K command palette — jump to any mix or run an action. */
export const CommandPalette = () => {
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
      <div className="flex items-center gap-3 border-b border-line-08 px-[18px] py-4">
        <Icon name="search" size={20} className="text-muted-2" />
        <input
          autoFocus
          className="flex-1 border-none bg-transparent text-[16px] text-primary outline-none placeholder:text-muted-2"
          placeholder="Jump to a mix or run a command…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        <kbd className="rounded-[6px] border border-line-12 px-1.5 py-[3px] text-[10px] font-bold uppercase text-faint">
          esc
        </kbd>
      </div>
      <div className="flex flex-col gap-0.5 p-2">
        {items.map((cmd, i) => {
          const isActive = i === active;
          return (
            <button
              key={cmd.id}
              type="button"
              className={clsx(
                'flex items-center gap-3 rounded-sm border-none px-3 py-2.5 text-left text-primary cursor-pointer',
                isActive ? 'bg-accent/14' : 'bg-transparent',
              )}
              onMouseEnter={() => setActive(i)}
              onClick={() => run(cmd)}
            >
              <Icon name={cmd.icon} size={18} className={isActive ? 'text-accent' : 'text-icon-muted'} />
              <span className="flex-1 text-[14px] font-medium">{cmd.label}</span>
              {cmd.hint && <span className="text-[11px] text-faint">{cmd.hint}</span>}
            </button>
          );
        })}
        {items.length === 0 && (
          <div className="p-6 text-center text-[13.5px] text-muted-2">No matches.</div>
        )}
      </div>
    </Modal>
  );
};
