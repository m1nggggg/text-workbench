import type { JsonDiff, JsonValue } from '../compare/types';
import { alignJsonSourceLines } from './jsonSourceAlignment';
import { createJsonLines, jsonLineClass } from './jsonLineModel';

type JsonSourceDiffProps = {
  left: JsonValue;
  right: JsonValue;
  diffs: JsonDiff[];
};

const JsonSourceDiff = ({ left, right, diffs }: JsonSourceDiffProps) => {
  const rows = alignJsonSourceLines(createJsonLines(left), createJsonLines(right));

  return (
    <div className="json-source-scroll" role="table" aria-label="Linked formatted JSON sources">
      <div className="json-source-header" role="row">
        <span role="columnheader">Ln</span><strong role="columnheader">Original</strong>
        <span role="columnheader">Ln</span><strong role="columnheader">Modified</strong>
      </div>
      <div role="rowgroup">
        {rows.map((row, index) => {
          const structuralChange = Boolean(
            row.left && row.right && row.left.path === row.right.path && row.left.text !== row.right.text,
          );
          const leftClass = row.left ? jsonLineClass(row.left.path, 'left', diffs) || (structuralChange ? 'json-line-changed' : '') : '';
          const rightClass = row.right ? jsonLineClass(row.right.path, 'right', diffs) || (structuralChange ? 'json-line-changed' : '') : '';
          return (
            <div className="json-source-row" role="row" key={`${row.left?.path ?? 'empty'}-${row.right?.path ?? 'empty'}-${index}`}>
              <span className="json-source-number" role="cell">{row.leftLineNumber ?? ''}</span>
              <code className={`json-source-code ${leftClass}${row.left ? '' : ' is-empty'}`} role="cell">{row.left?.text ?? ''}</code>
              <span className="json-source-number" role="cell">{row.rightLineNumber ?? ''}</span>
              <code className={`json-source-code ${rightClass}${row.right ? '' : ' is-empty'}`} role="cell">{row.right?.text ?? ''}</code>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JsonSourceDiff;
