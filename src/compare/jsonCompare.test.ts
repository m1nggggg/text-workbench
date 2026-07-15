import { beautifyJson, compareJson, parseJsonInput } from './jsonCompare';

describe('parseJsonInput', () => {
  it('returns an error for empty JSON', () => {
    const result = parseJsonInput('', 'left');

    expect(result).toEqual({
      ok: false,
      error: { side: 'left', message: 'Original JSON is required.' },
    });
  });

  it('treats whitespace-only JSON as empty input', () => {
    const result = parseJsonInput('  \n\t', 'right');

    expect(result).toEqual({
      ok: false,
      error: { side: 'right', message: 'Modified JSON is required.' },
    });
  });

  it('returns an error for invalid JSON', () => {
    const result = parseJsonInput('{ bad', 'right');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.side).toBe('right');
      expect(result.error.message).toMatch(/^Modified JSON is invalid:/);
    }
  });
});

describe('beautifyJson', () => {
  it('formats valid compact JSON', () => {
    const result = beautifyJson('{"name":"Ada","items":[1,2]}', 'left');

    expect(result).toEqual({
      ok: true,
      value: '{\n  "name": "Ada",\n  "items": [\n    1,\n    2\n  ]\n}',
    });
  });

  it('keeps invalid JSON out of the success path', () => {
    const result = beautifyJson('{"name":', 'left');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/^Original JSON is invalid:/);
    }
  });
});

describe('compareJson', () => {
  it('ignores whitespace differences', () => {
    const result = compareJson('{"a":1}', '{\n  "a": 1\n}');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 0, removed: 0, changed: 0 });
      expect(result.diffs).toEqual([]);
    }
  });

  it('ignores object key order differences', () => {
    const result = compareJson('{"b":2,"a":1}', '{"a":1,"b":2}');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.diffs).toEqual([]);
      expect(result.formattedLeft).toBe(result.formattedRight);
    }
  });

  it('reports a nested changed value with a JSON path', () => {
    const result = compareJson('{"user":{"name":"Ada"}}', '{"user":{"name":"Grace"}}');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 0, removed: 0, changed: 1 });
      expect(result.diffs).toEqual([
        { kind: 'changed', path: 'user.name', leftValue: 'Ada', rightValue: 'Grace' },
      ]);
    }
  });

  it('supports primitive JSON roots', () => {
    const result = compareJson('true', 'false');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.diffs).toEqual([{ kind: 'changed', path: 'root', leftValue: true, rightValue: false }]);
    }
  });

  it('formats paths for property names that are not identifiers', () => {
    const result = compareJson('{"feature.flag":false}', '{"feature.flag":true}');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.diffs[0].path).toBe('["feature.flag"]');
    }
  });

  it('reports added and removed object keys', () => {
    const result = compareJson('{"user":{"name":"Ada","role":"admin"}}', '{"user":{"name":"Ada","active":true}}');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 1, removed: 1, changed: 0 });
      expect(result.diffs).toEqual([
        { kind: 'added', path: 'user.active', rightValue: true },
        { kind: 'removed', path: 'user.role', leftValue: 'admin' },
      ]);
    }
  });

  it('reports array additions removals and changes by index path', () => {
    const result = compareJson('{"items":[1,2,3]}', '{"items":[1,4,3,5]}');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 1, removed: 0, changed: 1 });
      expect(result.diffs).toEqual([
        { kind: 'changed', path: 'items[1]', leftValue: 2, rightValue: 4 },
        { kind: 'added', path: 'items[3]', rightValue: 5 },
      ]);
    }
  });

  it('aligns an inserted array item without cascading false changes', () => {
    const result = compareJson('{"items":[1,2,3]}', '{"items":[0,1,2,3]}');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 1, removed: 0, changed: 0 });
      expect(result.diffs).toEqual([{ kind: 'added', path: 'items[0]', rightValue: 0 }]);
    }
  });

  it('aligns a removed array item without cascading false changes', () => {
    const result = compareJson('{"items":[1,2,3,4]}', '{"items":[1,3,4]}');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 0, removed: 1, changed: 0 });
      expect(result.diffs).toEqual([{ kind: 'removed', path: 'items[1]', leftValue: 2 }]);
    }
  });

  it('does not compare when either side has invalid JSON', () => {
    const result = compareJson('{"ok":true}', '{ bad');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.leftError).toBeUndefined();
      expect(result.rightError?.message).toMatch(/^Modified JSON is invalid:/);
    }
  });
});
