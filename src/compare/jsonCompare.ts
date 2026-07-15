import { collectAlignedArrayDiffs } from './jsonArrayCompare';
import type { PathSegment } from './jsonArrayCompare';
import type {
  BeautifyJsonResult,
  CompareSide,
  DiffSummary,
  JsonCompareResult,
  JsonDiff,
  JsonObject,
  JsonParseResult,
  JsonValue,
} from './types';

const sideLabel = (side: CompareSide) => (side === 'left' ? 'Original' : 'Modified');

export const parseJsonInput = (input: string, side: CompareSide): JsonParseResult => {
  if (input.trim().length === 0) {
    return { ok: false, error: { side, message: `${sideLabel(side)} JSON is required.` } };
  }

  try {
    return { ok: true, value: JSON.parse(input) as JsonValue };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to parse JSON.';

    return {
      ok: false,
      error: { side, message: `${sideLabel(side)} JSON is invalid: ${message}` },
    };
  }
};

export const beautifyJson = (input: string, side: CompareSide): BeautifyJsonResult => {
  const parsed = parseJsonInput(input, side);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  return { ok: true, value: JSON.stringify(parsed.value, null, 2) };
};

export const compareJson = (leftInput: string, rightInput: string): JsonCompareResult => {
  const left = parseJsonInput(leftInput, 'left');
  const right = parseJsonInput(rightInput, 'right');

  if (!left.ok || !right.ok) {
    return {
      ok: false,
      leftError: left.ok ? undefined : left.error,
      rightError: right.ok ? undefined : right.error,
    };
  }

  const normalizedLeft = sortJsonValue(left.value);
  const normalizedRight = sortJsonValue(right.value);
  const diffs: JsonDiff[] = [];

  collectDiffs(normalizedLeft, normalizedRight, [], diffs);

  return {
    ok: true,
    summary: summarizeDiffs(diffs),
    diffs,
    formattedLeft: JSON.stringify(normalizedLeft, null, 2),
    formattedRight: JSON.stringify(normalizedRight, null, 2),
    normalizedLeft,
    normalizedRight,
  };
};

const collectDiffs = (
  left: JsonValue | undefined,
  right: JsonValue | undefined,
  path: PathSegment[],
  diffs: JsonDiff[],
) => {
  if (left === undefined) {
    diffs.push({ kind: 'added', path: formatPath(path), rightValue: right });
    return;
  }

  if (right === undefined) {
    diffs.push({ kind: 'removed', path: formatPath(path), leftValue: left });
    return;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    collectAlignedArrayDiffs(left, right, path, diffs, collectDiffs);
    return;
  }

  if (isJsonObject(left) && isJsonObject(right)) {
    const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort();

    for (const key of keys) {
      const leftHasKey = Object.prototype.hasOwnProperty.call(left, key);
      const rightHasKey = Object.prototype.hasOwnProperty.call(right, key);

      collectDiffs(leftHasKey ? left[key] : undefined, rightHasKey ? right[key] : undefined, [...path, key], diffs);
    }

    return;
  }

  if (!Object.is(left, right)) {
    diffs.push({ kind: 'changed', path: formatPath(path), leftValue: left, rightValue: right });
  }
};

const summarizeDiffs = (diffs: JsonDiff[]): DiffSummary => {
  return diffs.reduce<DiffSummary>(
    (summary, diff) => ({
      ...summary,
      [diff.kind]: summary[diff.kind] + 1,
    }),
    { added: 0, removed: 0, changed: 0 },
  );
};

const sortJsonValue = (value: JsonValue): JsonValue => {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }

  if (isJsonObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce<JsonObject>((sorted, key) => {
        sorted[key] = sortJsonValue(value[key]);
        return sorted;
      }, {});
  }

  return value;
};

const isJsonObject = (value: JsonValue): value is JsonObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const formatPath = (segments: PathSegment[]): string => {
  if (segments.length === 0) {
    return 'root';
  }

  return segments.reduce<string>((path, segment) => {
    if (typeof segment === 'number') {
      return `${path}[${segment}]`;
    }

    if (/^[A-Za-z_$][\w$]*$/.test(segment)) {
      return path ? `${path}.${segment}` : segment;
    }

    return `${path}[${JSON.stringify(segment)}]`;
  }, '');
};
