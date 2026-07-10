import { CheckCircle2 } from 'lucide-react';
import type { DiffSummary } from '../compare/types';
import SummaryBar from './SummaryBar';

type ResultsHeaderProps = {
  title: string;
  summary: DiffSummary;
  durationMs: number;
  unitLabel: string;
};

const ResultsHeader = ({ title, summary, durationMs, unitLabel }: ResultsHeaderProps) => {
  const total = summary.added + summary.removed + summary.changed;
  const identical = total === 0;

  return (
    <div className="results-header">
      <div className="result-heading">
        <span className={`result-icon${identical ? ' is-identical' : ''}`} aria-hidden="true">
          {identical ? <CheckCircle2 size={18} /> : total}
        </span>
        <div>
          <h2>{identical ? 'Inputs are identical' : title}</h2>
          <p>{identical ? `No ${unitLabel} differences found` : `${total} ${total === 1 ? 'difference' : 'differences'} found`} · {durationMs} ms</p>
        </div>
      </div>
      <div className="result-actions">
        <SummaryBar summary={summary} />
      </div>
    </div>
  );
};

export default ResultsHeader;
