import { useRef, useState } from 'react';
import type { RefObject, UIEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { JsonCompareResult, JsonValue } from '../compare/types';
import JsonSourceDiff from './JsonSourceDiff';
import ResultsHeader from './ResultsHeader';

type JsonResultsProps = {
  result: Extract<JsonCompareResult, { ok: true }>;
  durationMs: number;
};

const serializeValue = (value: JsonValue | undefined) => {
  if (value === undefined) return '—';
  return JSON.stringify(value);
};

const displayValue = (value: JsonValue | undefined) => {
  const serialized = serializeValue(value);
  return serialized.length > 4_000 ? `${serialized.slice(0, 4_000)}… (${serialized.length.toLocaleString()} chars)` : serialized;
};

const JsonResults = ({ result, durationMs }: JsonResultsProps) => {
  const [page, setPage] = useState(0);
  const largeSource = result.formattedLeft.length + result.formattedRight.length > 300_000;
  const [sourceOpen, setSourceOpen] = useState(!largeSource && result.diffs.length > 0);
  const originalSource = useRef<HTMLPreElement>(null);
  const modifiedSource = useRef<HTMLPreElement>(null);
  const pageSize = 200;
  const pageCount = Math.max(1, Math.ceil(result.diffs.length / pageSize));
  const pageStart = page * pageSize;
  const visibleDiffs = result.diffs.slice(pageStart, pageStart + pageSize);

  const syncSourceScroll = (side: 'left' | 'right', event: UIEvent<HTMLPreElement>) => {
    const target = side === 'left' ? modifiedSource.current : originalSource.current;
    if (!target) return;
    if (target.scrollTop !== event.currentTarget.scrollTop) target.scrollTop = event.currentTarget.scrollTop;
    if (target.scrollLeft !== event.currentTarget.scrollLeft) target.scrollLeft = event.currentTarget.scrollLeft;
  };

  return (
    <section className="results-panel json-results-panel" aria-label="Compare results">
      <ResultsHeader
        title="JSON differences"
        summary={result.summary}
        durationMs={durationMs}
        unitLabel="structural"
      />

      {result.diffs.length > 0 ? (
        <div className="json-diff-table" role="table" aria-label="JSON path differences">
          <div className="json-diff-table-header" role="row">
            <span role="columnheader">Change</span>
            <span role="columnheader">JSON path</span>
            <span role="columnheader">Original</span>
            <span role="columnheader">Modified</span>
          </div>
          <div className="json-diff-rows" role="rowgroup">
            {visibleDiffs.map((diff, pageIndex) => {
              const index = pageStart + pageIndex;
              return (
              <div
                className={`json-diff-row json-diff-${diff.kind}`}
                id={`json-change-${index}`}
                key={`${diff.kind}-${diff.path}`}
                role="row"
                tabIndex={-1}
              >
                <span role="cell"><i className="diff-kind">{diff.kind === 'added' ? '+' : diff.kind === 'removed' ? '−' : '~'}<b>{diff.kind}</b></i></span>
                <code role="cell">{diff.path}</code>
                <code role="cell" className="diff-value diff-before">{displayValue(diff.leftValue)}</code>
                <code role="cell" className="diff-value diff-after">{displayValue(diff.rightValue)}</code>
              </div>
              );
            })}
          </div>
          {pageCount > 1 ? (
            <div className="result-pagination" aria-label="JSON result pages">
              <span>{(pageStart + 1).toLocaleString()}–{Math.min(pageStart + pageSize, result.diffs.length).toLocaleString()} of {result.diffs.length.toLocaleString()}</span>
              <button className="icon-button" type="button" aria-label="Previous result page" disabled={page === 0} onClick={() => setPage((current) => current - 1)}><ChevronLeft aria-hidden="true" size={15} /></button>
              <button className="icon-button" type="button" aria-label="Next result page" disabled={page === pageCount - 1} onClick={() => setPage((current) => current + 1)}><ChevronRight aria-hidden="true" size={15} /></button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="identical-state"><p>Both inputs resolve to the same JSON structure and values.</p><span>Whitespace and object key order are ignored.</span></div>
      )}

      <details className="source-details" open={sourceOpen} onToggle={(event) => setSourceOpen(event.currentTarget.open)}>
        <summary><span>Formatted source context{largeSource ? ' · large input' : ''}</span><i>Scroll linked</i></summary>
        {sourceOpen ? (
          <div className="json-result-grid">
            {largeSource ? (
              <>
                <LargeJsonSourcePane title="Original" formatted={result.formattedLeft} sourceRef={originalSource} onScroll={(event) => syncSourceScroll('left', event)} />
                <LargeJsonSourcePane title="Modified" formatted={result.formattedRight} sourceRef={modifiedSource} onScroll={(event) => syncSourceScroll('right', event)} />
              </>
            ) : <JsonSourceDiff left={result.normalizedLeft} right={result.normalizedRight} diffs={result.diffs} />}
          </div>
        ) : null}
      </details>
    </section>
  );
};

type LargeJsonSourcePaneProps = {
  title: string;
  formatted: string;
  sourceRef: RefObject<HTMLPreElement>;
  onScroll: (event: UIEvent<HTMLPreElement>) => void;
};

const LargeJsonSourcePane = ({ title, formatted, sourceRef, onScroll }: LargeJsonSourcePaneProps) => (
  <section className="json-pane" aria-label={`${title} formatted JSON`}>
    <h3>{title}</h3>
    <pre ref={sourceRef} aria-label={`${title} source`} className="json-plain-source" onScroll={onScroll}>{formatted}</pre>
  </section>
);

export default JsonResults;
