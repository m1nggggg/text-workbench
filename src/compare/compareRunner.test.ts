import { largeComparisonThreshold, shouldUseComparisonWorker } from './compareRunner';

describe('comparison worker routing', () => {
  it('keeps small comparisons synchronous', () => {
    expect(shouldUseComparisonWorker({ mode: 'text', leftInput: 'small', rightInput: 'small' })).toBe(false);
  });

  it('routes large comparisons away from the UI thread', () => {
    expect(shouldUseComparisonWorker({
      mode: 'text',
      leftInput: 'a'.repeat(largeComparisonThreshold),
      rightInput: '',
    })).toBe(true);
  });
});
