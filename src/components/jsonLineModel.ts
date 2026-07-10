import type { DiffKind, JsonDiff, JsonObject, JsonValue } from '../compare/types';

export type JsonLine = { path: string; text: string };

export const jsonLineClass = (path: string, side: 'left' | 'right', diffs: JsonDiff[]): string => {
  const diff = diffs.find((candidate) => lineUsesDiff(path, side, candidate));
  if (!diff) return '';

  const classByKind: Record<DiffKind, string> = {
    added: 'json-line-added',
    removed: 'json-line-removed',
    changed: 'json-line-changed',
  };
  return classByKind[diff.kind];
};

const lineUsesDiff = (linePath: string, side: 'left' | 'right', diff: JsonDiff) => {
  if ((diff.kind === 'added' && side === 'left') || (diff.kind === 'removed' && side === 'right')) return false;
  if (linePath === diff.path) return true;

  const sideValue = side === 'left' ? diff.leftValue : diff.rightValue;
  if (!isContainer(sideValue)) return false;
  if (diff.path === 'root') return true;
  return linePath.startsWith(`${diff.path}.`) || linePath.startsWith(`${diff.path}[`);
};

const isContainer = (value: JsonValue | undefined) => typeof value === 'object' && value !== null;

export const createJsonLines = (value: JsonValue, path = 'root', indent = 0, label?: string): JsonLine[] => {
  const prefix = '  '.repeat(indent);
  const labelPrefix = label ? `${JSON.stringify(label)}: ` : '';

  if (Array.isArray(value)) {
    if (value.length === 0) return [{ path, text: `${prefix}${labelPrefix}[]` }];
    const lines: JsonLine[] = [{ path, text: `${prefix}${labelPrefix}[` }];
    value.forEach((item, index) => appendChildLines(lines, createJsonLines(item, appendPath(path, index), indent + 1), index, value.length));
    lines.push({ path, text: `${prefix}]` });
    return lines;
  }

  if (isJsonObject(value)) {
    const keys = Object.keys(value).sort();
    if (keys.length === 0) return [{ path, text: `${prefix}${labelPrefix}{}` }];
    const lines: JsonLine[] = [{ path, text: `${prefix}${labelPrefix}{` }];
    keys.forEach((key, index) => appendChildLines(lines, createJsonLines(value[key], appendPath(path, key), indent + 1, key), index, keys.length));
    lines.push({ path, text: `${prefix}}` });
    return lines;
  }

  return [{ path, text: `${prefix}${labelPrefix}${JSON.stringify(value)}` }];
};

const appendChildLines = (target: JsonLine[], childLines: JsonLine[], index: number, length: number) => {
  if (index < length - 1) childLines[childLines.length - 1].text += ',';
  target.push(...childLines);
};

const appendPath = (path: string, segment: string | number): string => {
  const base = path === 'root' ? '' : path;
  if (typeof segment === 'number') return `${base}[${segment}]`;
  if (/^[A-Za-z_$][\w$]*$/.test(segment)) return base ? `${base}.${segment}` : segment;
  return `${base}[${JSON.stringify(segment)}]`;
};

const isJsonObject = (value: JsonValue): value is JsonObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};
