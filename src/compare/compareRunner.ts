import type { CompareWorkerRequest, CompareWorkerResponse } from './workerTypes';

export const largeComparisonThreshold = 750_000;

export const shouldUseComparisonWorker = (request: CompareWorkerRequest) => {
  return request.leftInput.length + request.rightInput.length >= largeComparisonThreshold;
};

export const runComparisonInWorker = (
  request: CompareWorkerRequest,
  onComplete: (response: CompareWorkerResponse) => void,
  onError: (message: string) => void,
) => {
  const worker = new Worker(new URL('./compare.worker.ts', import.meta.url), {
    type: 'module',
    name: 'compare-worker',
  });

  worker.onmessage = (event: MessageEvent<CompareWorkerResponse>) => {
    onComplete(event.data);
    worker.terminate();
  };
  worker.onerror = (event) => {
    onError(event.message || 'The comparison worker stopped unexpectedly.');
    worker.terminate();
  };
  worker.postMessage(request);

  return () => worker.terminate();
};
