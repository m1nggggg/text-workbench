import { GitCompareArrows, LoaderCircle, LockKeyhole } from 'lucide-react';
import type { CompareMode } from '../compare/types';
import ModeSelector from './ModeSelector';

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
      <span className="privacy-badge"><LockKeyhole aria-hidden="true" size={13} /> Local only</span>
      <ModeSelector mode={mode} onModeChange={onModeChange} />
      <button className="primary-button" type="button" aria-label="Compare" disabled={isComparing} onClick={onCompare}>
        {isComparing ? <LoaderCircle className="is-spinning" aria-hidden="true" size={16} /> : <GitCompareArrows aria-hidden="true" size={16} />}
        {isComparing ? 'Comparing' : 'Compare'}
        <kbd>{shortcutLabel}</kbd>
      </button>
    </div>
  </header>
);

export default AppHeader;
