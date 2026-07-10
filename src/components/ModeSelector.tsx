import { Braces, Pilcrow } from 'lucide-react';
import type { CompareMode } from '../compare/types';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

type ModeSelectorProps = {
  mode: CompareMode;
  onModeChange: (mode: CompareMode) => void;
};

const modes = [
  { id: 'json' as const, label: 'JSON', Icon: Braces },
  { id: 'text' as const, label: 'Text', Icon: Pilcrow },
];

const ModeSelector = ({ mode, onModeChange }: ModeSelectorProps) => {
  return (
    <Tabs className="mode-tabs" value={mode} onValueChange={(value) => onModeChange(value as CompareMode)}>
      <TabsList aria-label="Compare mode">
        {modes.map(({ id, label, Icon }) => (
          <TabsTrigger aria-controls="compare-workspace" id={`${id}-mode-tab`} key={id} value={id}>
            <Icon aria-hidden="true" strokeWidth={1.7} />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default ModeSelector;
