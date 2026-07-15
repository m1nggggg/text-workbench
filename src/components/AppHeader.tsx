import { GitCompareArrows, LoaderCircle } from 'lucide-react';
import type { CompareMode } from '../compare/types';
import ModeSelector from './ModeSelector';
import { Button } from './ui/button';
import { Kbd } from './ui/kbd';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

type AppHeaderProps = {
  mode: CompareMode;
  onModeChange: (mode: CompareMode) => void;
  onCompare: () => void;
  isComparing: boolean;
};

const shortcutLabel = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘↵' : 'Ctrl↵';

const AppHeader = ({ mode, onModeChange, onCompare, isComparing }: AppHeaderProps) => (
  <header className="top-bar">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">
          <GitCompareArrows strokeWidth={1.8} />
      </div>
      <div>
        <h1>Text JSON Compare</h1>
        <p>JSON &amp; text diff workbench</p>
      </div>
    </div>

    <div className="top-actions">
      <div className="compare-controls">
        <ModeSelector mode={mode} onModeChange={onModeChange} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="primary-button" size="sm" type="button" aria-label="Compare" aria-keyshortcuts="Control+Enter Meta+Enter" disabled={isComparing} onClick={onCompare}>
              {isComparing ? <LoaderCircle className="is-spinning" data-icon="inline-start" aria-hidden="true" /> : <GitCompareArrows data-icon="inline-start" aria-hidden="true" />}
              {isComparing ? 'Comparing' : 'Compare'}
              {!isComparing ? <Kbd className="compare-shortcut" aria-hidden="true">{shortcutLabel}</Kbd> : null}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Compare inputs · {shortcutLabel}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  </header>
);

export default AppHeader;
