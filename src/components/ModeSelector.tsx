import { Braces, Pilcrow } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import type { CompareMode } from '../compare/types';

type ModeSelectorProps = {
  mode: CompareMode;
  onModeChange: (mode: CompareMode) => void;
};

const modes = [
  { id: 'json' as const, label: 'JSON', Icon: Braces },
  { id: 'text' as const, label: 'Text', Icon: Pilcrow },
];

const ModeSelector = ({ mode, onModeChange }: ModeSelectorProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keyOffset: Partial<Record<string, number>> = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
    const offset = keyOffset[event.key];
    const targetIndex = event.key === 'Home' ? 0 : event.key === 'End' ? modes.length - 1 : offset === undefined ? undefined : (index + offset + modes.length) % modes.length;

    if (targetIndex === undefined) return;
    event.preventDefault();
    onModeChange(modes[targetIndex].id);
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="tab"]');
    tabs?.[targetIndex]?.focus();
  };

  return (
    <div className="mode-tabs" role="tablist" aria-label="Compare mode">
      {modes.map(({ id, label, Icon }) => (
        <button
          className="mode-tab"
          type="button"
          role="tab"
          aria-selected={mode === id}
          aria-controls="compare-workspace"
          id={`${id}-mode-tab`}
          tabIndex={mode === id ? 0 : -1}
          key={id}
          onClick={() => onModeChange(id)}
          onKeyDown={(event) => handleKeyDown(event, modes.findIndex((candidate) => candidate.id === id))}
        >
          <Icon aria-hidden="true" size={15} strokeWidth={1.8} />
          {label}
        </button>
      ))}
    </div>
  );
};

export default ModeSelector;
