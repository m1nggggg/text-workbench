import { ArrowLeftRight, Eraser, FlaskConical } from 'lucide-react';
import type { CompareMode, TextCompareOptions } from '../compare/types';
import TextComparisonOptions from './TextComparisonOptions';
import { Button } from './ui/button';

type WorkspaceToolbarProps = {
  canClear: boolean;
  canSwap: boolean;
  mode: CompareMode;
  textOptions: TextCompareOptions;
  onTextOptionChange: (option: keyof TextCompareOptions, enabled: boolean) => void;
  onLoadExample: () => void;
  onSwap: () => void;
  onClear: () => void;
};

const WorkspaceToolbar = ({ canClear, canSwap, mode, textOptions, onTextOptionChange, onLoadExample, onSwap, onClear }: WorkspaceToolbarProps) => (
  <div className="workspace-toolbar">
    <div>
      <h2>Inputs</h2>
      <p>Paste, type, or drop a file into either editor.</p>
    </div>
    <div className="workspace-actions">
      {mode === 'text' ? <TextComparisonOptions options={textOptions} onChange={onTextOptionChange} /> : null}
      <Button className="toolbar-button" variant="outline" size="sm" type="button" onClick={onLoadExample}>
        <FlaskConical data-icon="inline-start" aria-hidden="true" /> Example
      </Button>
      <Button className="toolbar-button" variant="outline" size="sm" type="button" disabled={!canSwap} onClick={onSwap} aria-label="Swap inputs">
        <ArrowLeftRight data-icon="inline-start" aria-hidden="true" /> Swap
      </Button>
      <Button className="toolbar-button clear-all-button" variant="ghost" size="sm" type="button" disabled={!canClear} onClick={onClear}>
        <Eraser data-icon="inline-start" aria-hidden="true" /> Clear all
      </Button>
    </div>
  </div>
);

export default WorkspaceToolbar;
