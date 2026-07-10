import type { DiffSummary } from '../compare/types';
import { Badge } from './ui/badge';

type SummaryBarProps = { summary: DiffSummary };

const SummaryBar = ({ summary }: SummaryBarProps) => (
  <div className="summary-bar" aria-label="Diff summary">
    <Badge variant="outline" className="summary-added"><i aria-hidden="true">+</i> Added: {summary.added}</Badge>
    <Badge variant="outline" className="summary-removed"><i aria-hidden="true">−</i> Removed: {summary.removed}</Badge>
    <Badge variant="outline" className="summary-changed"><i aria-hidden="true">~</i> Changed: {summary.changed}</Badge>
  </div>
);

export default SummaryBar;
