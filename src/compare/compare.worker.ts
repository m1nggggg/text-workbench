/// <reference lib="webworker" />

import { compareJson } from './jsonCompare';
import { compareText } from './textCompare';
import type { CompareWorkerRequest, CompareWorkerResponse } from './workerTypes';

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<CompareWorkerRequest>) => {
  const startedAt = performance.now();
  const { mode, leftInput, rightInput, textOptions } = event.data;
  const duration = () => Math.max(0.1, Math.round((performance.now() - startedAt) * 10) / 10);
  const response: CompareWorkerResponse = mode === 'json'
    ? { mode, result: compareJson(leftInput, rightInput), durationMs: duration() }
    : { mode, result: compareText(leftInput, rightInput, textOptions), durationMs: duration() };

  workerScope.postMessage(response);
};
