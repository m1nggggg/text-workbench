import { useMemo, useState } from 'react';
import type { TextCompareOptions, TextCompareResult, TextDiffRow } from '../compare/types';
import ResultsHeader from './ResultsHeader';
import ResultTokens from './ResultTokens';

type TextResultsProps = {
  result: Extract<TextCompareResult, { ok: true }>;
  durationMs: number;
  options: TextCompareOptions;
};

type DisplayItem =
  | { type: 'row'; row: TextDiffRow }
  | { type: 'gap'; id: string; count: number };

const contextLines = 3;

const buildDisplayItems = (rows: TextDiffRow[], showAll: boolean): DisplayItem[] => {
  if (showAll || rows.length <= 80) return rows.map((row) => ({ type: 'row', row }));

  const visible = new Set<number>([0, 1, rows.length - 2, rows.length - 1]);
  rows.forEach((row, index) => {
    if (row.kind === 'unchanged') return;
    for (let offset = -contextLines; offset <= contextLines; offset += 1) visible.add(index + offset);
  });

  const items: DisplayItem[] = [];
  let index = 0;
  while (index < rows.length) {
    if (visible.has(index)) {
      items.push({ type: 'row', row: rows[index] });
      index += 1;
      continue;
    }

    const start = index;
    while (index < rows.length && !visible.has(index)) index += 1;
    items.push({ type: 'gap', id: `gap-${start}`, count: index - start });
  }
  return items;
};

const activeOptionLabels = (options: TextCompareOptions) => [
  options.ignoreWhitespace ? 'whitespace' : null,
  options.ignoreCase ? 'case' : null,
].filter(Boolean) as string[];

const TextResults = ({ result, durationMs, options }: TextResultsProps) => {
  const [showAll, setShowAll] = useState(false);
  const changedRows = useMemo(() => result.rows.filter((row) => row.kind !== 'unchanged'), [result.rows]);
  const displayItems = useMemo(() => buildDisplayItems(result.rows, showAll), [result.rows, showAll]);
  const optionLabels = activeOptionLabels(options);

  return (
    <section className="results-panel text-results-panel" aria-label="Compare results">
      <ResultsHeader
        title="Text differences"
        summary={result.summary}
        durationMs={durationMs}
        unitLabel={optionLabels.length > 0 ? 'text under active rules' : 'text'}
      />

      {changedRows.length === 0 ? (
        <div className="identical-state">
          <p>{optionLabels.length > 0 ? 'No differences under active comparison rules.' : 'Every character and line ending matches.'}</p>
          <span>{optionLabels.length > 0 ? `Ignored: ${optionLabels.join(' and ')}.` : 'The comparison includes whitespace and final newlines.'}</span>
        </div>
      ) : (
        <div className="text-result-scroll">
          <div className="text-result-grid" role="table" aria-label="Text diff rows">
            <div className="text-result-columns" role="row">
              <span role="columnheader">Ln</span><strong role="columnheader">Original</strong>
              <span role="columnheader"><span className="visually-hidden">Change</span><i aria-hidden="true">Δ</i></span>
              <span role="columnheader">Ln</span><strong role="columnheader">Modified</strong>
            </div>
            {displayItems.map((item) => item.type === 'gap' ? (
              <div className="collapsed-lines" role="row" key={item.id}>
                <div role="cell">
                  <button type="button" onClick={() => setShowAll(true)}>Show {item.count.toLocaleString()} unchanged lines</button>
                </div>
              </div>
            ) : (
              <TextRow row={item.row} key={item.row.id} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

const TextRow = ({ row }: { row: TextDiffRow }) => {
  const isChange = row.kind !== 'unchanged';
  const marker = row.kind === 'added' ? '+' : row.kind === 'removed' ? '−' : row.kind === 'changed' ? '~' : '';
  return (
    <div
      className={`text-result-row row-${row.kind}`}
      id={isChange ? `text-change-${row.id}` : undefined}
      role="row"
      tabIndex={isChange ? -1 : undefined}
    >
      <div className="line-number" role="cell">{row.leftLineNumber ?? ''}</div>
      <pre className="text-cell left-cell" role="cell">
        <ResultTokens tokens={row.leftTokens} isMissing={row.leftLineNumber === undefined} isBlank={row.leftLineNumber !== undefined && row.leftText === ''} />
        {row.leftLineNumber && row.leftHasNewline === false ? <small>No newline at EOF</small> : null}
      </pre>
      <span className="row-marker" role="cell" aria-label={isChange ? row.kind : undefined}>{marker}</span>
      <div className="line-number" role="cell">{row.rightLineNumber ?? ''}</div>
      <pre className="text-cell right-cell" role="cell">
        <ResultTokens tokens={row.rightTokens} isMissing={row.rightLineNumber === undefined} isBlank={row.rightLineNumber !== undefined && row.rightText === ''} />
        {row.rightLineNumber && row.rightHasNewline === false ? <small>No newline at EOF</small> : null}
      </pre>
    </div>
  );
};

export default TextResults;
