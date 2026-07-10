import type { JsonDiff } from '../compare/types';
import { jsonLineClass } from './jsonLineModel';

describe('jsonLineClass', () => {
  it('highlights every descendant of a removed object on the original side', () => {
    const diffs: JsonDiff[] = [{
      kind: 'removed',
      path: 'friends[0]',
      leftValue: { id: 0, name: 'Kelly Deleon' },
    }];

    expect(jsonLineClass('friends[0].id', 'left', diffs)).toBe('json-line-removed');
    expect(jsonLineClass('friends[0].name', 'left', diffs)).toBe('json-line-removed');
    expect(jsonLineClass('friends[0].id', 'right', diffs)).toBe('');
  });

  it('keeps primitive changes scoped to their exact path', () => {
    const diffs: JsonDiff[] = [{ kind: 'changed', path: 'user.name', leftValue: 'Ada', rightValue: 'Grace' }];

    expect(jsonLineClass('user.name', 'left', diffs)).toBe('json-line-changed');
    expect(jsonLineClass('user.name.first', 'left', diffs)).toBe('');
  });
});
