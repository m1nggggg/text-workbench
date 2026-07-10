import type { TextDiffRow } from './types';

export type LineRecord = {
  text: string;
  hasNewline: boolean;
};

export const toLineRecords = (input: string): LineRecord[] => {
  const values = input.split('\n');
  const endsWithNewline = input.endsWith('\n');

  if (endsWithNewline) values.pop();

  return values.map((text, index) => ({
    text,
    hasNewline: index < values.length - 1 || endsWithNewline,
  }));
};

export const applyFinalNewlineState = (
  rows: TextDiffRow[],
  leftLines: LineRecord[],
  rightLines: LineRecord[],
) => {
  const left = leftLines[leftLines.length - 1];
  const right = rightLines[rightLines.length - 1];
  if (!left || !right || left.hasNewline === right.hasNewline) return;

  const finalPair = rows.find(
    (row) => row.leftLineNumber === leftLines.length && row.rightLineNumber === rightLines.length,
  );
  if (!finalPair) return;

  finalPair.leftHasNewline = left.hasNewline;
  finalPair.rightHasNewline = right.hasNewline;
  finalPair.kind = 'changed';
};
