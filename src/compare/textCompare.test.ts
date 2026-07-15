import { compareText } from './textCompare';

describe('compareText', () => {
  it('returns validation errors for empty inputs', () => {
    const result = compareText('', 'right');

    expect(result).toEqual({
      ok: false,
      leftError: { side: 'left', message: 'Original text is required.' },
    });
  });

  it('reports unchanged text', () => {
    const result = compareText('alpha\nbeta', 'alpha\nbeta');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 0, removed: 0, changed: 0 });
      expect(result.rows.map((row) => row.kind)).toEqual(['unchanged', 'unchanged']);
    }
  });

  it('aligns added lines with an empty left counterpart', () => {
    const result = compareText('alpha', 'alpha\nbeta');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 1, removed: 0, changed: 0 });
      expect(result.rows[1]).toMatchObject({ kind: 'added', leftText: '', rightText: 'beta' });
    }
  });

  it('aligns removed lines with an empty right counterpart', () => {
    const result = compareText('alpha\nbeta', 'alpha');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 0, removed: 1, changed: 0 });
      expect(result.rows[1]).toMatchObject({ kind: 'removed', leftText: 'beta', rightText: '' });
    }
  });

  it('marks changed lines and highlights changed words', () => {
    const result = compareText('status: pending', 'status: approved');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 0, removed: 0, changed: 1 });
      expect(result.rows[0].kind).toBe('changed');
      expect(result.rows[0].leftTokens).toContainEqual({ text: 'pending', kind: 'removed' });
      expect(result.rows[0].rightTokens).toContainEqual({ text: 'approved', kind: 'added' });
    }
  });

  it('uses character highlights for a single changed word', () => {
    const result = compareText('color', 'colour');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0].kind).toBe('changed');
      expect(result.rows[0].rightTokens).toContainEqual({ text: 'u', kind: 'added' });
    }
  });

  it('preserves blank lines when they are changed', () => {
    const result = compareText('alpha\n\nomega', 'alpha\nbeta\nomega');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 0, removed: 0, changed: 1 });
      expect(result.rows[1]).toMatchObject({
        kind: 'changed',
        leftLineNumber: 2,
        rightLineNumber: 2,
        leftText: '',
        rightText: 'beta',
      });
      expect(result.rows[2]).toMatchObject({
        kind: 'unchanged',
        leftLineNumber: 3,
        rightLineNumber: 3,
        leftText: 'omega',
      });
    }
  });

  it('reports a missing final newline without changing the visible line text', () => {
    const result = compareText('alpha', 'alpha\n');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 0, removed: 0, changed: 1 });
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        kind: 'changed',
        leftText: 'alpha',
        rightText: 'alpha',
        leftHasNewline: false,
        rightHasNewline: true,
      });
    }
  });

  it('ignores leading, trailing, and repeated spaces or tabs when requested', () => {
    const result = compareText('  status:\t pending  ', 'status: pending', { ignoreWhitespace: true, ignoreCase: false });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 0, removed: 0, changed: 0 });
      expect(result.rows[0]).toMatchObject({
        kind: 'unchanged',
        leftText: '  status:\t pending  ',
        rightText: 'status: pending',
      });
    }
  });

  it('does not remove meaningful word boundaries when ignoring whitespace', () => {
    const result = compareText('foo bar', 'foobar', { ignoreWhitespace: true, ignoreCase: false });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.summary.changed).toBe(1);
  });

  it('ignores case while preserving original source text when requested', () => {
    const result = compareText('Release READY', 'release ready', { ignoreWhitespace: false, ignoreCase: true });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary.changed).toBe(0);
      expect(result.rows[0]).toMatchObject({ leftText: 'Release READY', rightText: 'release ready' });
    }
  });
});
