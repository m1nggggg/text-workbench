import { diffArrays } from 'diff';
import { applyFinalNewlineState, toLineRecords } from './textLineModel';
import type { LineRecord } from './textLineModel';
import { equalTokens, tokenizeChangedLine } from './textTokenize';
import type { DiffSummary, TextCompareOptions, TextCompareResult, TextDiffRow } from './types';

type ArrayChange = {
  value: LineRecord[];
  added?: boolean;
  removed?: boolean;
};

export const defaultTextCompareOptions: TextCompareOptions = {
  ignoreWhitespace: false,
  ignoreCase: false,
};

export const compareText = (
  leftInput: string,
  rightInput: string,
  options: TextCompareOptions = defaultTextCompareOptions,
): TextCompareResult => {
  const leftError = leftInput.length === 0 ? { side: 'left' as const, message: 'Original text is required.' } : undefined;
  const rightError = rightInput.length === 0 ? { side: 'right' as const, message: 'Modified text is required.' } : undefined;

  if (leftError || rightError) {
    return { ok: false, leftError, rightError };
  }

  const leftLines = toLineRecords(leftInput);
  const rightLines = toLineRecords(rightInput);
  const changes = diffArrays(leftLines, rightLines, {
    comparator: (left, right) => normalizeLine(left.text, options) === normalizeLine(right.text, options),
  }) as ArrayChange[];
  const rows = buildRows(changes, leftLines, rightLines);
  applyFinalNewlineState(rows, leftLines, rightLines);

  return { ok: true, summary: summarizeRows(rows), rows };
};

const normalizeLine = (text: string, options: TextCompareOptions) => {
  const whitespaceNormalized = options.ignoreWhitespace ? text.trim().replace(/[ \t]+/g, ' ') : text;
  return options.ignoreCase ? whitespaceNormalized.toLowerCase() : whitespaceNormalized;
};

const buildRows = (changes: ArrayChange[], leftLines: LineRecord[], rightLines: LineRecord[]): TextDiffRow[] => {
  const rows: TextDiffRow[] = [];
  let leftLineNumber = 1;
  let rightLineNumber = 1;

  for (let index = 0; index < changes.length; index += 1) {
    const change = changes[index];
    const next = changes[index + 1];

    if (change.removed && next?.added) {
      const paired = pairChangedLines(change.value, next.value, rows.length, leftLineNumber, rightLineNumber);
      rows.push(...paired);
      leftLineNumber += change.value.length;
      rightLineNumber += next.value.length;
      index += 1;
      continue;
    }

    change.value.forEach((line) => {
      if (change.added) {
        rows.push(createAddedRow(rows.length, rightLineNumber, line));
        rightLineNumber += 1;
        return;
      }

      if (change.removed) {
        rows.push(createRemovedRow(rows.length, leftLineNumber, line));
        leftLineNumber += 1;
        return;
      }

      rows.push(createUnchangedRow(
        rows.length,
        leftLineNumber,
        rightLineNumber,
        leftLines[leftLineNumber - 1],
        rightLines[rightLineNumber - 1],
      ));
      leftLineNumber += 1;
      rightLineNumber += 1;
    });
  }

  return rows;
};

const pairChangedLines = (
  leftLines: LineRecord[],
  rightLines: LineRecord[],
  rowOffset: number,
  leftOffset: number,
  rightOffset: number,
): TextDiffRow[] => {
  const rows: TextDiffRow[] = [];
  const maxLength = Math.max(leftLines.length, rightLines.length);

  for (let index = 0; index < maxLength; index += 1) {
    const left = leftLines[index];
    const right = rightLines[index];

    if (left && right) {
      rows.push(createChangedRow(rowOffset + rows.length, leftOffset + index, rightOffset + index, left, right));
    } else if (left) {
      rows.push(createRemovedRow(rowOffset + rows.length, leftOffset + index, left));
    } else if (right) {
      rows.push(createAddedRow(rowOffset + rows.length, rightOffset + index, right));
    }
  }

  return rows;
};

const createUnchangedRow = (
  index: number,
  leftLineNumber: number,
  rightLineNumber: number,
  left: LineRecord,
  right: LineRecord,
): TextDiffRow => ({
  id: `row-${index}`,
  kind: 'unchanged',
  leftLineNumber,
  rightLineNumber,
  leftText: left.text,
  rightText: right.text,
  leftTokens: [{ text: left.text, kind: 'equal' }],
  rightTokens: [{ text: right.text, kind: 'equal' }],
  leftHasNewline: left.hasNewline,
  rightHasNewline: right.hasNewline,
});

const createChangedRow = (
  index: number,
  leftLineNumber: number,
  rightLineNumber: number,
  left: LineRecord,
  right: LineRecord,
): TextDiffRow => {
  const tokens = left.text === right.text ? equalTokens(left.text) : tokenizeChangedLine(left.text, right.text);

  return {
    id: `row-${index}`,
    kind: 'changed',
    leftLineNumber,
    rightLineNumber,
    leftText: left.text,
    rightText: right.text,
    ...tokens,
    leftHasNewline: left.hasNewline,
    rightHasNewline: right.hasNewline,
  };
};

const createAddedRow = (index: number, lineNumber: number, line: LineRecord): TextDiffRow => ({
  id: `row-${index}`,
  kind: 'added',
  rightLineNumber: lineNumber,
  leftText: '',
  rightText: line.text,
  leftTokens: [],
  rightTokens: [{ text: line.text, kind: 'added' }],
  rightHasNewline: line.hasNewline,
});

const createRemovedRow = (index: number, lineNumber: number, line: LineRecord): TextDiffRow => ({
  id: `row-${index}`,
  kind: 'removed',
  leftLineNumber: lineNumber,
  leftText: line.text,
  rightText: '',
  leftTokens: [{ text: line.text, kind: 'removed' }],
  rightTokens: [],
  leftHasNewline: line.hasNewline,
});

const summarizeRows = (rows: TextDiffRow[]): DiffSummary => {
  return rows.reduce<DiffSummary>(
    (summary, row) => {
      if (row.kind === 'unchanged') {
        return summary;
      }

      summary[row.kind] += 1;
      return summary;
    },
    { added: 0, removed: 0, changed: 0 },
  );
};
