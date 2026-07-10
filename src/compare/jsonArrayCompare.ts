import { diffArrays } from 'diff';
import type { JsonDiff, JsonValue } from './types';

export type PathSegment = string | number;
type ArrayItem = { value: JsonValue; signature: string };
type ArrayChange = { value: ArrayItem[]; added?: boolean; removed?: boolean };
type CollectDiffs = (
  left: JsonValue | undefined,
  right: JsonValue | undefined,
  path: PathSegment[],
  diffs: JsonDiff[],
) => void;

export const collectAlignedArrayDiffs = (
  left: JsonValue[],
  right: JsonValue[],
  path: PathSegment[],
  diffs: JsonDiff[],
  collectDiffs: CollectDiffs,
) => {
  const changes = diffArrays(toArrayItems(left), toArrayItems(right), {
    comparator: (leftItem, rightItem) => leftItem.signature === rightItem.signature,
  }) as ArrayChange[];
  let leftIndex = 0;
  let rightIndex = 0;

  for (let index = 0; index < changes.length; index += 1) {
    const change = changes[index];
    const next = changes[index + 1];

    if (change.removed && next?.added) {
      const paired = Math.min(change.value.length, next.value.length);
      for (let pairIndex = 0; pairIndex < paired; pairIndex += 1) {
        collectDiffs(change.value[pairIndex].value, next.value[pairIndex].value, [...path, rightIndex + pairIndex], diffs);
      }
      leftIndex += paired;
      rightIndex += paired;
      collectItems(change.value.slice(paired), path, diffs, leftIndex, 'removed', collectDiffs);
      collectItems(next.value.slice(paired), path, diffs, rightIndex, 'added', collectDiffs);
      leftIndex += change.value.length - paired;
      rightIndex += next.value.length - paired;
      index += 1;
      continue;
    }

    if (change.added) {
      collectItems(change.value, path, diffs, rightIndex, 'added', collectDiffs);
      rightIndex += change.value.length;
    } else if (change.removed) {
      collectItems(change.value, path, diffs, leftIndex, 'removed', collectDiffs);
      leftIndex += change.value.length;
    } else {
      leftIndex += change.value.length;
      rightIndex += change.value.length;
    }
  }
};

const toArrayItems = (values: JsonValue[]): ArrayItem[] => {
  return values.map((value) => ({ value, signature: JSON.stringify(value) }));
};

const collectItems = (
  items: ArrayItem[],
  path: PathSegment[],
  diffs: JsonDiff[],
  startIndex: number,
  kind: 'added' | 'removed',
  collectDiffs: CollectDiffs,
) => {
  items.forEach((item, index) => {
    const itemPath = [...path, startIndex + index];
    if (kind === 'added') collectDiffs(undefined, item.value, itemPath, diffs);
    else collectDiffs(item.value, undefined, itemPath, diffs);
  });
};
