import { diffArrays } from 'diff';
import type { JsonLine } from './jsonLineModel';

export type AlignedJsonSourceRow = {
  left?: JsonLine;
  right?: JsonLine;
  leftLineNumber?: number;
  rightLineNumber?: number;
};

type LineChange = {
  value: JsonLine[];
  added?: boolean;
  removed?: boolean;
};

export const alignJsonSourceLines = (leftLines: JsonLine[], rightLines: JsonLine[]) => {
  const changes = diffArrays(leftLines, rightLines, { comparator: sourceLinesMatch }) as LineChange[];
  const rows: AlignedJsonSourceRow[] = [];
  let leftIndex = 0;
  let rightIndex = 0;

  for (let index = 0; index < changes.length; index += 1) {
    const change = changes[index];
    const next = changes[index + 1];

    if (change.removed && next?.added) {
      const paired = Math.min(change.value.length, next.value.length);
      for (let offset = 0; offset < paired; offset += 1) {
        rows.push({ left: change.value[offset], right: next.value[offset] });
      }
      change.value.slice(paired).forEach((left) => rows.push({ left }));
      next.value.slice(paired).forEach((right) => rows.push({ right }));
      leftIndex += change.value.length;
      rightIndex += next.value.length;
      index += 1;
      continue;
    }

    if (change.added) {
      change.value.forEach((right) => rows.push({ right }));
      rightIndex += change.value.length;
      continue;
    }

    if (change.removed) {
      change.value.forEach((left) => rows.push({ left }));
      leftIndex += change.value.length;
      continue;
    }

    change.value.forEach((_, offset) => {
      rows.push({ left: leftLines[leftIndex + offset], right: rightLines[rightIndex + offset] });
    });
    leftIndex += change.value.length;
    rightIndex += change.value.length;
  }

  let leftLineNumber = 0;
  let rightLineNumber = 0;
  return rows.map((row) => ({
    ...row,
    leftLineNumber: row.left ? ++leftLineNumber : undefined,
    rightLineNumber: row.right ? ++rightLineNumber : undefined,
  }));
};

const sourceLinesMatch = (left: JsonLine, right: JsonLine) => {
  if (left.text.trim() === right.text.trim()) return true;
  return left.path === right.path && structuralKind(left.text) === structuralKind(right.text);
};

const structuralKind = (text: string) => {
  const trimmed = text.trim().replace(/,$/, '');
  if (trimmed.endsWith('{')) return 'object-open';
  if (trimmed === '}') return 'object-close';
  if (trimmed.endsWith('[')) return 'array-open';
  if (trimmed === ']') return 'array-close';
  return 'value';
};
