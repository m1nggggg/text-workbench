import { ArrowLeftRight, Eraser, FlaskConical } from 'lucide-react';
import type { CompareMode, TextCompareOptions } from '../compare/types';
import TextComparisonOptions from './TextComparisonOptions';

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
      <button className="toolbar-button" type="button" onClick={onLoadExample}>
        <FlaskConical aria-hidden="true" size={15} /> Example
      </button>
      <button className="toolbar-button" type="button" disabled={!canSwap} onClick={onSwap} aria-label="Swap inputs">
        <ArrowLeftRight aria-hidden="true" size={15} /> Swap
      </button>
      <button className="toolbar-button" type="button" disabled={!canClear} onClick={onClear}>
        <Eraser aria-hidden="true" size={15} /> Clear all
      </button>
    </div>
  </div>
);

export default WorkspaceToolbar;
