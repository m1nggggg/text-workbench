import { compareJson } from './jsonCompare';
import { compareText } from './textCompare';

describe('comparison performance guardrails', () => {
  it('compares ten thousand mostly-equal text lines within two seconds', () => {
    const left = Array.from({ length: 10_000 }, (_, index) => `record ${index}: stable`);
    const right = [...left];
    right[2_500] = 'record 2500: changed';
    right[7_500] = 'record 7500: changed';
    const startedAt = performance.now();

    const result = compareText(left.join('\n'), right.join('\n'));

    expect(result.ok).toBe(true);
    expect(performance.now() - startedAt).toBeLessThan(2_000);
  });

  it('aligns a five-thousand-item JSON array insertion within two seconds', () => {
    const left = { items: Array.from({ length: 5_000 }, (_, id) => ({ id, active: true })) };
    const right = { items: [{ id: -1, active: false }, ...left.items] };
    const startedAt = performance.now();

    const result = compareJson(JSON.stringify(left), JSON.stringify(right));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.summary).toEqual({ added: 1, removed: 0, changed: 0 });
    expect(performance.now() - startedAt).toBeLessThan(2_000);
  });
});
