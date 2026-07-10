export type CompareSide = 'left' | 'right';

export type CompareMode = 'json' | 'text';

export type TextCompareOptions = {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
};

export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

export type InputError = {
  side: CompareSide;
  message: string;
};

export type DiffKind = 'added' | 'removed' | 'changed';

export type DiffSummary = {
  added: number;
  removed: number;
  changed: number;
};

export type JsonDiff = {
  kind: DiffKind;
  path: string;
  leftValue?: JsonValue;
  rightValue?: JsonValue;
};

export type JsonParseResult =
  | { ok: true; value: JsonValue }
  | { ok: false; error: InputError };

export type BeautifyJsonResult =
  | { ok: true; value: string }
  | { ok: false; error: InputError };

export type JsonCompareResult =
  | {
      ok: true;
      summary: DiffSummary;
      diffs: JsonDiff[];
      formattedLeft: string;
      formattedRight: string;
      normalizedLeft: JsonValue;
      normalizedRight: JsonValue;
    }
  | { ok: false; leftError?: InputError; rightError?: InputError };

export type TextTokenKind = 'equal' | 'added' | 'removed' | 'changed';

export type TextToken = {
  text: string;
  kind: TextTokenKind;
};

export type TextDiffRowKind = 'unchanged' | DiffKind;

export type TextDiffRow = {
  id: string;
  kind: TextDiffRowKind;
  leftLineNumber?: number;
  rightLineNumber?: number;
  leftText: string;
  rightText: string;
  leftTokens: TextToken[];
  rightTokens: TextToken[];
  leftHasNewline?: boolean;
  rightHasNewline?: boolean;
};

export type TextCompareResult =
  | { ok: true; summary: DiffSummary; rows: TextDiffRow[] }
  | { ok: false; leftError?: InputError; rightError?: InputError };
