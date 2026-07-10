import { GitCompareArrows, LoaderCircle, LockKeyhole } from 'lucide-react';
import type { CompareMode } from '../compare/types';
import ModeSelector from './ModeSelector';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
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
        <GitCompareArrows size={19} strokeWidth={1.8} />
      </div>
      <div>
        <h1>Text JSON Compare</h1>
        <p>JSON &amp; text diff workbench</p>
      </div>
    </div>

    <div className="top-actions">
      <Badge className="privacy-badge" variant="success"><LockKeyhole aria-hidden="true" /> Local only</Badge>
      <Separator className="top-separator" orientation="vertical" />
      <div className="compare-controls">
        <ModeSelector mode={mode} onModeChange={onModeChange} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="primary-button" size="sm" type="button" aria-label="Compare" disabled={isComparing} onClick={onCompare}>
              {isComparing ? <LoaderCircle className="is-spinning" aria-hidden="true" /> : <GitCompareArrows aria-hidden="true" />}
              {isComparing ? 'Comparing' : 'Compare'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Compare inputs · {shortcutLabel}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  </header>
);

export default AppHeader;
