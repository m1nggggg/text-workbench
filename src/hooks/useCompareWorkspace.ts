import { useCallback, useEffect, useRef, useState } from 'react';
import { runComparisonInWorker, shouldUseComparisonWorker } from '../compare/compareRunner';
import { beautifyJson, compareJson } from '../compare/jsonCompare';
import { compareText, defaultTextCompareOptions } from '../compare/textCompare';
import type { CompareMode, CompareSide, InputError, JsonCompareResult, TextCompareOptions, TextCompareResult } from '../compare/types';
import type { CompareWorkerResponse } from '../compare/workerTypes';
import { compareExamples } from '../product/examples';

type EditorErrors = { left?: InputError; right?: InputError };

export type ResultState =
  | { mode: 'json'; result: Extract<JsonCompareResult, { ok: true }>; durationMs: number }
  | { mode: 'text'; result: Extract<TextCompareResult, { ok: true }>; durationMs: number };

const roundedDuration = (startedAt: number) => Math.max(0.1, Math.round((performance.now() - startedAt) * 10) / 10);

export const useCompareWorkspace = () => {
  const [mode, setMode] = useState<CompareMode>('json');
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [errors, setErrors] = useState<EditorErrors>({});
  const [resultState, setResultState] = useState<ResultState | null>(null);
  const [notice, setNotice] = useState('Ready. Your content stays in this browser.');
  const [isComparing, setIsComparing] = useState(false);
  const [textOptions, setTextOptions] = useState<TextCompareOptions>(defaultTextCompareOptions);
  const cancelWorker = useRef<() => void>();

  const cancelActiveComparison = useCallback(() => {
    cancelWorker.current?.();
    cancelWorker.current = undefined;
    setIsComparing(false);
  }, []);

  const changeInput = useCallback((side: CompareSide, value: string) => {
    cancelActiveComparison();
    if (side === 'left') {
      setLeftText(value);
    } else {
      setRightText(value);
    }

    setErrors((current) => ({ ...current, [side]: undefined }));
    setResultState(null);
    setNotice('Input updated. Compare when ready.');
  }, [cancelActiveComparison]);

  const handleModeChange = useCallback((nextMode: CompareMode) => {
    cancelActiveComparison();
    setMode(nextMode);
    setErrors({});
    setResultState(null);
    setNotice(`${nextMode === 'json' ? 'JSON' : 'Text'} comparison selected.`);
  }, [cancelActiveComparison]);

  const handleBeautify = useCallback(
    (side: CompareSide) => {
      const result = beautifyJson(side === 'left' ? leftText : rightText, side);

      if (!result.ok) {
        setErrors((current) => ({ ...current, [side]: result.error }));
        setNotice(`${side === 'left' ? 'Original' : 'Modified'} contains invalid JSON.`);
        return;
      }

      changeInput(side, result.value);
      setNotice(`${side === 'left' ? 'Original' : 'Modified'} JSON formatted.`);
    },
    [changeInput, leftText, rightText],
  );

  const applyComparison = useCallback((response: CompareWorkerResponse) => {
    cancelWorker.current = undefined;
    setIsComparing(false);

    if (!response.result.ok) {
      setErrors({ left: response.result.leftError, right: response.result.rightError });
      setResultState(null);
      setNotice(response.mode === 'json' ? 'Fix the highlighted JSON before comparing.' : 'Add content to both editors before comparing.');
      return;
    }

    setErrors({});
    setResultState(response as ResultState);
    setNotice(`Comparison complete in ${response.durationMs} ms.`);
  }, []);

  const handleCompare = useCallback(() => {
    cancelActiveComparison();
    const request = { mode, leftInput: leftText, rightInput: rightText, textOptions };

    if (shouldUseComparisonWorker(request)) {
      setIsComparing(true);
      setNotice('Comparing large inputs in a background worker…');
      try {
        cancelWorker.current = runComparisonInWorker(
          request,
          applyComparison,
          (message) => {
            cancelWorker.current = undefined;
            setIsComparing(false);
            setResultState(null);
            setNotice(`Comparison failed: ${message}`);
          },
        );
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Background workers are unavailable.';
        setIsComparing(false);
        setNotice(`Comparison failed: ${message}`);
      }
      return;
    }

    const startedAt = performance.now();
    const response: CompareWorkerResponse = mode === 'json'
      ? { mode, result: compareJson(leftText, rightText), durationMs: roundedDuration(startedAt) }
      : { mode, result: compareText(leftText, rightText, textOptions), durationMs: roundedDuration(startedAt) };
    applyComparison(response);
  }, [applyComparison, cancelActiveComparison, leftText, mode, rightText, textOptions]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        handleCompare();
      }
    };

    window.addEventListener('keydown', handleShortcut, { capture: true });
    return () => window.removeEventListener('keydown', handleShortcut, { capture: true });
  }, [handleCompare]);

  useEffect(() => cancelActiveComparison, [cancelActiveComparison]);

  const clearInput = useCallback(
    (side: CompareSide) => {
      changeInput(side, '');
      setNotice(`${side === 'left' ? 'Original' : 'Modified'} input cleared.`);
    },
    [changeInput],
  );

  const clearAll = useCallback(() => {
    cancelActiveComparison();
    setLeftText('');
    setRightText('');
    setErrors({});
    setResultState(null);
    setNotice('Both inputs cleared.');
  }, [cancelActiveComparison]);

  const swapInputs = useCallback(() => {
    cancelActiveComparison();
    setLeftText(rightText);
    setRightText(leftText);
    setErrors({});
    setResultState(null);
    setNotice('Original and modified inputs swapped.');
  }, [cancelActiveComparison, leftText, rightText]);

  const loadExample = useCallback(() => {
    cancelActiveComparison();
    setLeftText(compareExamples[mode].left);
    setRightText(compareExamples[mode].right);
    setErrors({});
    setResultState(null);
    setNotice(`${mode === 'json' ? 'JSON' : 'Text'} example loaded.`);
  }, [cancelActiveComparison, mode]);

  const changeTextOption = useCallback((option: keyof TextCompareOptions, enabled: boolean) => {
    cancelActiveComparison();
    setTextOptions((current) => ({ ...current, [option]: enabled }));
    setErrors({});
    setResultState(null);
    setNotice('Text comparison options updated. Compare again when ready.');
  }, [cancelActiveComparison]);

  return {
    mode,
    leftText,
    rightText,
    errors,
    resultState,
    notice,
    isComparing,
    textOptions,
    setNotice,
    changeInput,
    handleModeChange,
    handleBeautify,
    handleCompare,
    clearInput,
    clearAll,
    swapInputs,
    loadExample,
    changeTextOption,
  };
};
