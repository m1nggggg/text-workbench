import { diffChars, diffWordsWithSpace } from 'diff';
import type { TextToken } from './types';

type TokenChange = {
  value: string;
  added?: boolean;
  removed?: boolean;
};

export const equalTokens = (text: string) => ({
  leftTokens: [{ text, kind: 'equal' as const }],
  rightTokens: [{ text, kind: 'equal' as const }],
});

export const tokenizeChangedLine = (leftText: string, rightText: string) => {
  const wordChanges = diffWordsWithSpace(leftText, rightText) as TokenChange[];
  const removedWords = wordChanges.filter((change) => change.removed && change.value.trim().length > 0);
  const addedWords = wordChanges.filter((change) => change.added && change.value.trim().length > 0);
  const isSingleWordChange =
    removedWords.length === 1 &&
    addedWords.length === 1 &&
    leftText.trim() === removedWords[0].value.trim() &&
    rightText.trim() === addedWords[0].value.trim();

  if (isSingleWordChange) {
    const changes = diffChars(leftText, rightText) as TokenChange[];
    return { leftTokens: toTokens(changes, 'left'), rightTokens: toTokens(changes, 'right') };
  }

  return {
    leftTokens: toTokens(wordChanges, 'left'),
    rightTokens: toTokens(wordChanges, 'right'),
  };
};

const toTokens = (changes: TokenChange[], side: 'left' | 'right'): TextToken[] => {
  return changes
    .filter((change) => (side === 'left' ? !change.added : !change.removed))
    .map((change) => ({
      text: change.value,
      kind: change.removed ? 'removed' : change.added ? 'added' : 'equal',
    }));
};
