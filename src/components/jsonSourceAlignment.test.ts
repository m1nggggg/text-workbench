import { createJsonLines } from './jsonLineModel';
import { alignJsonSourceLines } from './jsonSourceAlignment';

describe('alignJsonSourceLines', () => {
  it('adds an empty counterpart for an inserted property line', () => {
    const rows = alignJsonSourceLines(createJsonLines({ a: 1, c: 3 }), createJsonLines({ a: 1, b: 2, c: 3 }));
    const inserted = rows.find((row) => row.right?.path === 'b');

    expect(inserted?.left).toBeUndefined();
    expect(inserted?.right?.text).toContain('"b": 2');
  });

  it('aligns changed values that share the same JSON path', () => {
    const rows = alignJsonSourceLines(createJsonLines({ status: 'old' }), createJsonLines({ status: 'new' }));
    const changed = rows.find((row) => row.left?.path === 'status');

    expect(changed?.right?.path).toBe('status');
    expect(changed?.leftLineNumber).toBe(changed?.rightLineNumber);
  });
});
