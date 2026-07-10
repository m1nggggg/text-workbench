import type { DiffSummary } from '../compare/types';

type SummaryBarProps = { summary: DiffSummary };

const SummaryBar = ({ summary }: SummaryBarProps) => (
  <div className="summary-bar" aria-label="Diff summary">
    <span className="summary-added"><i aria-hidden="true">+</i> Added: {summary.added}</span>
    <span className="summary-removed"><i aria-hidden="true">−</i> Removed: {summary.removed}</span>
    <span className="summary-changed"><i aria-hidden="true">~</i> Changed: {summary.changed}</span>
  </div>
);

export default SummaryBar;
