import type { CompareMode, JsonCompareResult, TextCompareOptions, TextCompareResult } from './types';

export type CompareWorkerRequest = {
  mode: CompareMode;
  leftInput: string;
  rightInput: string;
  textOptions?: TextCompareOptions;
};

export type CompareWorkerResponse =
  | { mode: 'json'; result: JsonCompareResult; durationMs: number }
  | { mode: 'text'; result: TextCompareResult; durationMs: number };
