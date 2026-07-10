# Text JSON Compare Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-only web app that compares pasted JSON structurally and pasted text precisely, with side-by-side results, JSON beautify buttons, and inline validation errors.

**Architecture:** Use a static Vite + React + TypeScript app. Keep comparison engines in `src/compare/` independent from React, then render their normalized results through focused UI components in `src/components/`.

**Tech Stack:** Vite, React 18, TypeScript, Vitest, Testing Library, jsdom, `diff` for text line and token diffing.

## Global Constraints

- First version is paste-only: no file upload and no drag-and-drop.
- All comparison work happens in the browser: no backend and no server upload.
- Users manually select `JSON` or `Text` mode.
- Comparison runs only when the user clicks `Compare`; no live compare while typing.
- JSON mode compares structures, ignores whitespace, and ignores object key order.
- JSON mode blocks compare until both panes parse successfully.
- Each JSON pane has an independent `Beautify JSON` button.
- Invalid JSON errors appear inline under the affected editor and do not erase input.
- Text mode accepts any text and highlights changed lines, then changed words or characters inside changed lines.
- Desktop layout is side-by-side; mobile layout stacks panes vertically.
- Use restrained product UI styling, readable monospace content, accessible highlight colors, and no decorative motion.

---

## File Structure

- `package.json`: project metadata, scripts, and dependencies.
- `index.html`: Vite HTML entry.
- `vite.config.ts`: Vite React plugin and Vitest jsdom setup.
- `tsconfig.json`: TypeScript config for app and tests.
- `tsconfig.node.json`: TypeScript config for Vite config.
- `src/main.tsx`: React root bootstrap.
- `src/App.tsx`: top-level mode, editor, validation, and result state orchestration.
- `src/styles.css`: global product UI styling, diff highlights, and responsive layout.
- `src/test/setup.ts`: Testing Library jest-dom setup.
- `src/compare/types.ts`: shared compare result, error, diff, and token types.
- `src/compare/jsonCompare.ts`: JSON parsing, beautification, structural compare, and normalized formatting.
- `src/compare/jsonCompare.test.ts`: JSON compare and beautify tests.
- `src/compare/textCompare.ts`: text validation, line alignment, and word/character token diffing.
- `src/compare/textCompare.test.ts`: text compare tests.
- `src/components/ModeSelector.tsx`: JSON/Text mode selector.
- `src/components/CompareEditor.tsx`: labeled editor pane with clear and beautify actions.
- `src/components/SummaryBar.tsx`: added/removed/changed summary counts.
- `src/components/JsonResults.tsx`: JSON path summary and side-by-side highlighted formatted JSON.
- `src/components/TextResults.tsx`: side-by-side highlighted text rows.
- `src/components/ResultTokens.tsx`: token rendering for text result highlights.
- `src/App.test.tsx`: UI smoke tests for app flow, errors, beautify, compare, and mode behavior.

---

### Task 1: Project Scaffold And Test Harness

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/test/setup.ts`
- Create: `src/App.test.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Create: `src/styles.css`

**Interfaces:**
- Produces: `App` React component exported as default from `src/App.tsx`.
- Produces: `npm run test`, `npm run build`, and `npm run dev` scripts.

- [ ] **Step 1: Create package and tool configuration**

Create `package.json`:

```json
{
  "name": "text-json-compare",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "diff": "^5.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^24.1.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.0",
    "vitest": "^2.0.5"
  }
}
```

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Text JSON Compare</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    css: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: `node_modules/` and `package-lock.json` are created, and npm exits with code 0.

- [ ] **Step 3: Write the failing app smoke test**

Create `src/App.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the compare workspace heading', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /text json compare/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm run test -- src/App.test.tsx`

Expected: FAIL because `src/App.tsx` does not exist.

- [ ] **Step 5: Add the minimal app shell**

Create `src/App.tsx`:

```tsx
import './styles.css';

const App = () => {
  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Local browser tool</p>
          <h1>Text JSON Compare</h1>
        </div>
        <button className="primary-button" type="button">
          Compare
        </button>
      </header>
    </main>
  );
};

export default App;
```

Create `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `src/styles.css`:

```css
:root {
  color: oklch(24% 0.018 250);
  background: oklch(97% 0.006 250);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  --surface: oklch(99% 0.004 250);
  --surface-muted: oklch(94% 0.008 250);
  --border: oklch(82% 0.018 250);
  --text: oklch(24% 0.018 250);
  --muted: oklch(48% 0.02 250);
  --accent: oklch(50% 0.14 250);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
textarea,
select {
  font: inherit;
}

.app-shell {
  width: min(1440px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 32px 0;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: var(--text);
  font-size: 1.85rem;
  line-height: 1.1;
}

.primary-button {
  border: 0;
  border-radius: 10px;
  background: var(--accent);
  color: oklch(98% 0.006 250);
  cursor: pointer;
  font-weight: 700;
  padding: 10px 16px;
}

.primary-button:hover {
  background: oklch(45% 0.15 250);
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- src/App.test.tsx`

Expected: PASS with 1 test passing.

- [ ] **Step 7: Run the build**

Run: `npm run build`

Expected: PASS and `dist/` is created.

- [ ] **Step 8: Commit if the workspace is a git repo**

Run: `git rev-parse --is-inside-work-tree`

Expected in the current workspace: FAIL with `fatal: not a git repository`. Do not create a commit in that case.

If the command prints `true`, run:

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src
git commit -m "chore: scaffold compare app"
```

---

### Task 2: JSON Parse, Beautify, And Structural Compare

**Files:**
- Create: `src/compare/types.ts`
- Create: `src/compare/jsonCompare.test.ts`
- Create: `src/compare/jsonCompare.ts`

**Interfaces:**
- Produces: `parseJsonInput(input: string, side: CompareSide): JsonParseResult`.
- Produces: `beautifyJson(input: string, side: CompareSide): BeautifyJsonResult`.
- Produces: `compareJson(leftInput: string, rightInput: string): JsonCompareResult`.
- Produces: JSON diffs with `kind`, `path`, `leftValue`, and `rightValue` fields.

- [ ] **Step 1: Write failing JSON compare tests**

Create `src/compare/types.ts`:

```ts
export type CompareSide = 'left' | 'right';

export type CompareMode = 'json' | 'text';

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
```

Create `src/compare/jsonCompare.test.ts`:

```ts
import { beautifyJson, compareJson, parseJsonInput } from './jsonCompare';

describe('parseJsonInput', () => {
  it('returns an error for empty JSON', () => {
    const result = parseJsonInput('', 'left');

    expect(result).toEqual({
      ok: false,
      error: { side: 'left', message: 'Left JSON is required.' },
    });
  });

  it('returns an error for invalid JSON', () => {
    const result = parseJsonInput('{ bad', 'right');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.side).toBe('right');
      expect(result.error.message).toMatch(/^Right JSON is invalid:/);
    }
  });
});

describe('beautifyJson', () => {
  it('formats valid compact JSON', () => {
    const result = beautifyJson('{"name":"Ada","items":[1,2]}', 'left');

    expect(result).toEqual({
      ok: true,
      value: '{\n  "name": "Ada",\n  "items": [\n    1,\n    2\n  ]\n}',
    });
  });

  it('keeps invalid JSON out of the success path', () => {
    const result = beautifyJson('{"name":', 'left');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/^Left JSON is invalid:/);
    }
  });
});

describe('compareJson', () => {
  it('ignores whitespace differences', () => {
    const result = compareJson('{"a":1}', '{\n  "a": 1\n}');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 0, removed: 0, changed: 0 });
      expect(result.diffs).toEqual([]);
    }
  });

  it('ignores object key order differences', () => {
    const result = compareJson('{"b":2,"a":1}', '{"a":1,"b":2}');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.diffs).toEqual([]);
      expect(result.formattedLeft).toBe(result.formattedRight);
    }
  });

  it('reports a nested changed value with a JSON path', () => {
    const result = compareJson('{"user":{"name":"Ada"}}', '{"user":{"name":"Grace"}}');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 0, removed: 0, changed: 1 });
      expect(result.diffs).toEqual([
        { kind: 'changed', path: 'user.name', leftValue: 'Ada', rightValue: 'Grace' },
      ]);
    }
  });

  it('reports added and removed object keys', () => {
    const result = compareJson('{"user":{"name":"Ada","role":"admin"}}', '{"user":{"name":"Ada","active":true}}');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 1, removed: 1, changed: 0 });
      expect(result.diffs).toEqual([
        { kind: 'added', path: 'user.active', rightValue: true },
        { kind: 'removed', path: 'user.role', leftValue: 'admin' },
      ]);
    }
  });

  it('reports array additions removals and changes by index path', () => {
    const result = compareJson('{"items":[1,2,3]}', '{"items":[1,4,3,5]}');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 1, removed: 0, changed: 1 });
      expect(result.diffs).toEqual([
        { kind: 'changed', path: 'items[1]', leftValue: 2, rightValue: 4 },
        { kind: 'added', path: 'items[3]', rightValue: 5 },
      ]);
    }
  });

  it('does not compare when either side has invalid JSON', () => {
    const result = compareJson('{"ok":true}', '{ bad');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.leftError).toBeUndefined();
      expect(result.rightError?.message).toMatch(/^Right JSON is invalid:/);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/compare/jsonCompare.test.ts`

Expected: FAIL because `src/compare/jsonCompare.ts` does not exist.

- [ ] **Step 3: Implement JSON parse, beautify, and compare**

Create `src/compare/jsonCompare.ts`:

```ts
import type {
  BeautifyJsonResult,
  CompareSide,
  DiffSummary,
  JsonCompareResult,
  JsonDiff,
  JsonObject,
  JsonParseResult,
  JsonValue,
} from './types';

type PathSegment = string | number;

const sideLabel = (side: CompareSide) => (side === 'left' ? 'Left' : 'Right');

export const parseJsonInput = (input: string, side: CompareSide): JsonParseResult => {
  if (input.length === 0) {
    return { ok: false, error: { side, message: `${sideLabel(side)} JSON is required.` } };
  }

  try {
    return { ok: true, value: JSON.parse(input) as JsonValue };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to parse JSON.';

    return {
      ok: false,
      error: { side, message: `${sideLabel(side)} JSON is invalid: ${message}` },
    };
  }
};

export const beautifyJson = (input: string, side: CompareSide): BeautifyJsonResult => {
  const parsed = parseJsonInput(input, side);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  return { ok: true, value: JSON.stringify(parsed.value, null, 2) };
};

export const compareJson = (leftInput: string, rightInput: string): JsonCompareResult => {
  const left = parseJsonInput(leftInput, 'left');
  const right = parseJsonInput(rightInput, 'right');

  if (!left.ok || !right.ok) {
    return {
      ok: false,
      leftError: left.ok ? undefined : left.error,
      rightError: right.ok ? undefined : right.error,
    };
  }

  const normalizedLeft = sortJsonValue(left.value);
  const normalizedRight = sortJsonValue(right.value);
  const diffs: JsonDiff[] = [];

  collectDiffs(normalizedLeft, normalizedRight, [], diffs);

  return {
    ok: true,
    summary: summarizeDiffs(diffs),
    diffs,
    formattedLeft: JSON.stringify(normalizedLeft, null, 2),
    formattedRight: JSON.stringify(normalizedRight, null, 2),
    normalizedLeft,
    normalizedRight,
  };
};

const collectDiffs = (
  left: JsonValue | undefined,
  right: JsonValue | undefined,
  path: PathSegment[],
  diffs: JsonDiff[],
) => {
  if (left === undefined) {
    diffs.push({ kind: 'added', path: formatPath(path), rightValue: right });
    return;
  }

  if (right === undefined) {
    diffs.push({ kind: 'removed', path: formatPath(path), leftValue: left });
    return;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    const maxLength = Math.max(left.length, right.length);

    for (let index = 0; index < maxLength; index += 1) {
      collectDiffs(left[index], right[index], [...path, index], diffs);
    }

    return;
  }

  if (isJsonObject(left) && isJsonObject(right)) {
    const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort();

    for (const key of keys) {
      const leftHasKey = Object.prototype.hasOwnProperty.call(left, key);
      const rightHasKey = Object.prototype.hasOwnProperty.call(right, key);

      collectDiffs(leftHasKey ? left[key] : undefined, rightHasKey ? right[key] : undefined, [...path, key], diffs);
    }

    return;
  }

  if (!Object.is(left, right)) {
    diffs.push({ kind: 'changed', path: formatPath(path), leftValue: left, rightValue: right });
  }
};

const summarizeDiffs = (diffs: JsonDiff[]): DiffSummary => {
  return diffs.reduce<DiffSummary>(
    (summary, diff) => ({
      ...summary,
      [diff.kind]: summary[diff.kind] + 1,
    }),
    { added: 0, removed: 0, changed: 0 },
  );
};

const sortJsonValue = (value: JsonValue): JsonValue => {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }

  if (isJsonObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce<JsonObject>((sorted, key) => {
        sorted[key] = sortJsonValue(value[key]);
        return sorted;
      }, {});
  }

  return value;
};

const isJsonObject = (value: JsonValue): value is JsonObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const formatPath = (segments: PathSegment[]): string => {
  if (segments.length === 0) {
    return 'root';
  }

  return segments.reduce<string>((path, segment) => {
    if (typeof segment === 'number') {
      return `${path}[${segment}]`;
    }

    if (/^[A-Za-z_$][\w$]*$/.test(segment)) {
      return path ? `${path}.${segment}` : segment;
    }

    return `${path}[${JSON.stringify(segment)}]`;
  }, '');
};
```

- [ ] **Step 4: Run JSON tests to verify they pass**

Run: `npm run test -- src/compare/jsonCompare.test.ts`

Expected: PASS with all JSON tests passing.

- [ ] **Step 5: Run full test suite and build**

Run: `npm run test && npm run build`

Expected: PASS for tests and build.

- [ ] **Step 6: Commit if the workspace is a git repo**

Run: `git rev-parse --is-inside-work-tree`

Expected in the current workspace: FAIL with `fatal: not a git repository`. Do not create a commit in that case.

If the command prints `true`, run:

```bash
git add src/compare
git commit -m "feat: add structural json compare"
```

---

### Task 3: Text Compare Engine

**Files:**
- Modify: `src/compare/types.ts`
- Create: `src/compare/textCompare.test.ts`
- Create: `src/compare/textCompare.ts`

**Interfaces:**
- Consumes: `DiffSummary`, `DiffKind`, and `InputError` from `src/compare/types.ts`.
- Produces: `compareText(leftInput: string, rightInput: string): TextCompareResult`.
- Produces: aligned `TextDiffRow[]` rows with empty counterpart rows for additions and removals.
- Produces: `TextToken[]` for equal, added, removed, and changed inline text highlights.

- [ ] **Step 1: Add text result types**

Replace `src/compare/types.ts` with:

```ts
export type CompareSide = 'left' | 'right';

export type CompareMode = 'json' | 'text';

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
};

export type TextCompareResult =
  | { ok: true; summary: DiffSummary; rows: TextDiffRow[] }
  | { ok: false; leftError?: InputError; rightError?: InputError };
```

- [ ] **Step 2: Write failing text compare tests**

Create `src/compare/textCompare.test.ts`:

```ts
import { compareText } from './textCompare';

describe('compareText', () => {
  it('returns validation errors for empty inputs', () => {
    const result = compareText('', 'right');

    expect(result).toEqual({
      ok: false,
      leftError: { side: 'left', message: 'Left text is required.' },
    });
  });

  it('reports unchanged text', () => {
    const result = compareText('alpha\nbeta', 'alpha\nbeta');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 0, removed: 0, changed: 0 });
      expect(result.rows.map((row) => row.kind)).toEqual(['unchanged', 'unchanged']);
    }
  });

  it('aligns added lines with an empty left counterpart', () => {
    const result = compareText('alpha', 'alpha\nbeta');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 1, removed: 0, changed: 0 });
      expect(result.rows[1]).toMatchObject({ kind: 'added', leftText: '', rightText: 'beta' });
    }
  });

  it('aligns removed lines with an empty right counterpart', () => {
    const result = compareText('alpha\nbeta', 'alpha');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 0, removed: 1, changed: 0 });
      expect(result.rows[1]).toMatchObject({ kind: 'removed', leftText: 'beta', rightText: '' });
    }
  });

  it('marks changed lines and highlights changed words', () => {
    const result = compareText('status: pending', 'status: approved');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary).toEqual({ added: 0, removed: 0, changed: 1 });
      expect(result.rows[0].kind).toBe('changed');
      expect(result.rows[0].leftTokens).toContainEqual({ text: 'pending', kind: 'removed' });
      expect(result.rows[0].rightTokens).toContainEqual({ text: 'approved', kind: 'added' });
    }
  });

  it('uses character highlights for a single changed word', () => {
    const result = compareText('color', 'colour');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0].kind).toBe('changed');
      expect(result.rows[0].rightTokens).toContainEqual({ text: 'u', kind: 'added' });
    }
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test -- src/compare/textCompare.test.ts`

Expected: FAIL because `src/compare/textCompare.ts` does not exist.

- [ ] **Step 4: Implement text compare**

Create `src/compare/textCompare.ts`:

```ts
import { diffChars, diffLines, diffWordsWithSpace } from 'diff';
import type { DiffSummary, TextCompareResult, TextDiffRow, TextToken } from './types';

type DiffChange = {
  value: string;
  added?: boolean;
  removed?: boolean;
};

export const compareText = (leftInput: string, rightInput: string): TextCompareResult => {
  const leftError = leftInput.length === 0 ? { side: 'left' as const, message: 'Left text is required.' } : undefined;
  const rightError = rightInput.length === 0 ? { side: 'right' as const, message: 'Right text is required.' } : undefined;

  if (leftError || rightError) {
    return { ok: false, leftError, rightError };
  }

  const rows: TextDiffRow[] = [];
  const changes = diffLines(leftInput, rightInput) as DiffChange[];
  let leftLineNumber = 1;
  let rightLineNumber = 1;

  for (let index = 0; index < changes.length; index += 1) {
    const change = changes[index];
    const next = changes[index + 1];

    if (change.removed && next?.added) {
      const leftLines = splitLines(change.value);
      const rightLines = splitLines(next.value);
      const maxLength = Math.max(leftLines.length, rightLines.length);

      for (let rowIndex = 0; rowIndex < maxLength; rowIndex += 1) {
        const leftText = leftLines[rowIndex] ?? '';
        const rightText = rightLines[rowIndex] ?? '';

        if (leftText && rightText) {
          const { leftTokens, rightTokens } = tokenizeChangedLine(leftText, rightText);

          rows.push({
            id: `row-${rows.length}`,
            kind: 'changed',
            leftLineNumber: leftLineNumber,
            rightLineNumber: rightLineNumber,
            leftText,
            rightText,
            leftTokens,
            rightTokens,
          });
          leftLineNumber += 1;
          rightLineNumber += 1;
        } else if (leftText) {
          rows.push(createRemovedRow(rows.length, leftLineNumber, leftText));
          leftLineNumber += 1;
        } else if (rightText) {
          rows.push(createAddedRow(rows.length, rightLineNumber, rightText));
          rightLineNumber += 1;
        }
      }

      index += 1;
      continue;
    }

    const lines = splitLines(change.value);

    for (const line of lines) {
      if (change.added) {
        rows.push(createAddedRow(rows.length, rightLineNumber, line));
        rightLineNumber += 1;
      } else if (change.removed) {
        rows.push(createRemovedRow(rows.length, leftLineNumber, line));
        leftLineNumber += 1;
      } else {
        rows.push(createUnchangedRow(rows.length, leftLineNumber, rightLineNumber, line));
        leftLineNumber += 1;
        rightLineNumber += 1;
      }
    }
  }

  return { ok: true, summary: summarizeRows(rows), rows };
};

const splitLines = (value: string): string[] => {
  const lines = value.split('\n');

  if (lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines;
};

const createUnchangedRow = (
  index: number,
  leftLineNumber: number,
  rightLineNumber: number,
  text: string,
): TextDiffRow => ({
  id: `row-${index}`,
  kind: 'unchanged',
  leftLineNumber,
  rightLineNumber,
  leftText: text,
  rightText: text,
  leftTokens: [{ text, kind: 'equal' }],
  rightTokens: [{ text, kind: 'equal' }],
});

const createAddedRow = (index: number, rightLineNumber: number, text: string): TextDiffRow => ({
  id: `row-${index}`,
  kind: 'added',
  rightLineNumber,
  leftText: '',
  rightText: text,
  leftTokens: [],
  rightTokens: [{ text, kind: 'added' }],
});

const createRemovedRow = (index: number, leftLineNumber: number, text: string): TextDiffRow => ({
  id: `row-${index}`,
  kind: 'removed',
  leftLineNumber,
  leftText: text,
  rightText: '',
  leftTokens: [{ text, kind: 'removed' }],
  rightTokens: [],
});

const tokenizeChangedLine = (leftText: string, rightText: string) => {
  const wordChanges = diffWordsWithSpace(leftText, rightText) as DiffChange[];
  const removedWords = wordChanges.filter((change) => change.removed && change.value.trim().length > 0);
  const addedWords = wordChanges.filter((change) => change.added && change.value.trim().length > 0);

  const singleWordLineChange =
    removedWords.length === 1 &&
    addedWords.length === 1 &&
    leftText.trim() === removedWords[0].value.trim() &&
    rightText.trim() === addedWords[0].value.trim();

  if (singleWordLineChange) {
    return tokenizeCharacters(leftText, rightText);
  }

  return {
    leftTokens: wordChanges
      .filter((change) => !change.added)
      .map((change) => ({ text: change.value, kind: change.removed ? 'removed' : 'equal' }) satisfies TextToken),
    rightTokens: wordChanges
      .filter((change) => !change.removed)
      .map((change) => ({ text: change.value, kind: change.added ? 'added' : 'equal' }) satisfies TextToken),
  };
};

const tokenizeCharacters = (leftText: string, rightText: string) => {
  const changes = diffChars(leftText, rightText) as DiffChange[];

  return {
    leftTokens: changes
      .filter((change) => !change.added)
      .map((change) => ({ text: change.value, kind: change.removed ? 'removed' : 'equal' }) satisfies TextToken),
    rightTokens: changes
      .filter((change) => !change.removed)
      .map((change) => ({ text: change.value, kind: change.added ? 'added' : 'equal' }) satisfies TextToken),
  };
};

const summarizeRows = (rows: TextDiffRow[]): DiffSummary => {
  return rows.reduce<DiffSummary>(
    (summary, row) => {
      if (row.kind === 'added' || row.kind === 'removed' || row.kind === 'changed') {
        return { ...summary, [row.kind]: summary[row.kind] + 1 };
      }

      return summary;
    },
    { added: 0, removed: 0, changed: 0 },
  );
};
```

- [ ] **Step 5: Run text tests to verify they pass**

Run: `npm run test -- src/compare/textCompare.test.ts`

Expected: PASS with all text compare tests passing.

- [ ] **Step 6: Run full test suite and build**

Run: `npm run test && npm run build`

Expected: PASS for tests and build.

- [ ] **Step 7: Commit if the workspace is a git repo**

Run: `git rev-parse --is-inside-work-tree`

Expected in the current workspace: FAIL with `fatal: not a git repository`. Do not create a commit in that case.

If the command prints `true`, run:

```bash
git add src/compare
git commit -m "feat: add text compare engine"
```

---

### Task 4: Input Workspace, Mode Selector, Beautify, And Validation UI

**Files:**
- Create: `src/components/ModeSelector.tsx`
- Create: `src/components/CompareEditor.tsx`
- Replace: `src/App.test.tsx`
- Replace: `src/App.tsx`
- Replace: `src/styles.css`

**Interfaces:**
- Consumes: `CompareMode`, `CompareSide`, and `InputError` from `src/compare/types.ts`.
- Consumes: `beautifyJson(input, side)` from `src/compare/jsonCompare.ts`.
- Produces: `ModeSelector` controlled component.
- Produces: `CompareEditor` controlled component with `onBeautify`, `onClear`, and inline error rendering.
- Produces: app state for mode, left text, right text, and per-side errors.

- [ ] **Step 1: Write failing UI tests for mode, beautify, and clear behavior**

Replace `src/App.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App input workspace', () => {
  it('renders JSON mode with two beautify buttons', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /text json compare/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/compare mode/i)).toHaveValue('json');
    expect(screen.getAllByRole('button', { name: /beautify json/i })).toHaveLength(2);
  });

  it('hides beautify buttons in text mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText(/compare mode/i), 'text');

    expect(screen.queryByRole('button', { name: /beautify json/i })).not.toBeInTheDocument();
  });

  it('beautifies one JSON pane independently', async () => {
    const user = userEvent.setup();
    render(<App />);

    fireEvent.change(screen.getByLabelText(/left input/i), { target: { value: '{"name":"Ada"}' } });
    fireEvent.change(screen.getByLabelText(/right input/i), { target: { value: '{"name":"Grace"}' } });
    await user.click(screen.getByRole('button', { name: /beautify json for left/i }));

    expect(screen.getByLabelText(/left input/i)).toHaveValue('{\n  "name": "Ada"\n}');
    expect(screen.getByLabelText(/right input/i)).toHaveValue('{"name":"Grace"}');
  });

  it('shows an inline error for invalid JSON beautify without changing input', async () => {
    const user = userEvent.setup();
    render(<App />);

    fireEvent.change(screen.getByLabelText(/left input/i), { target: { value: '{bad' } });
    await user.click(screen.getByRole('button', { name: /beautify json for left/i }));

    expect(screen.getByLabelText(/left input/i)).toHaveValue('{bad');
    expect(screen.getByText(/^Left JSON is invalid:/)).toBeInTheDocument();
  });

  it('clears only the selected pane', async () => {
    const user = userEvent.setup();
    render(<App />);

    fireEvent.change(screen.getByLabelText(/left input/i), { target: { value: 'left value' } });
    fireEvent.change(screen.getByLabelText(/right input/i), { target: { value: 'right value' } });
    await user.click(screen.getByRole('button', { name: /clear left/i }));

    expect(screen.getByLabelText(/left input/i)).toHaveValue('');
    expect(screen.getByLabelText(/right input/i)).toHaveValue('right value');
  });
});
```

- [ ] **Step 2: Run UI tests to verify they fail**

Run: `npm run test -- src/App.test.tsx`

Expected: FAIL because mode selector, editors, and beautify controls are not implemented.

- [ ] **Step 3: Create mode selector and editor components**

Create `src/components/ModeSelector.tsx`:

```tsx
import type { CompareMode } from '../compare/types';

type ModeSelectorProps = {
  mode: CompareMode;
  onModeChange: (mode: CompareMode) => void;
};

const ModeSelector = ({ mode, onModeChange }: ModeSelectorProps) => {
  return (
    <label className="mode-selector">
      <span>Compare mode</span>
      <select value={mode} onChange={(event) => onModeChange(event.target.value as CompareMode)}>
        <option value="json">JSON</option>
        <option value="text">Text</option>
      </select>
    </label>
  );
};

export default ModeSelector;
```

Create `src/components/CompareEditor.tsx`:

```tsx
import type { CompareMode, InputError } from '../compare/types';

type CompareEditorProps = {
  side: 'left' | 'right';
  title: string;
  mode: CompareMode;
  value: string;
  error?: InputError;
  onChange: (value: string) => void;
  onBeautify: () => void;
  onClear: () => void;
};

const CompareEditor = ({
  side,
  title,
  mode,
  value,
  error,
  onChange,
  onBeautify,
  onClear,
}: CompareEditorProps) => {
  const sideLabel = side === 'left' ? 'Left' : 'Right';

  return (
    <section className="editor-pane" aria-labelledby={`${side}-editor-title`}>
      <div className="editor-header">
        <h2 id={`${side}-editor-title`}>{title}</h2>
        <div className="editor-actions">
          {mode === 'json' ? (
            <button className="secondary-button" type="button" onClick={onBeautify}>
              Beautify JSON for {sideLabel}
            </button>
          ) : null}
          <button className="ghost-button" type="button" onClick={onClear}>
            Clear {sideLabel}
          </button>
        </div>
      </div>
      <textarea
        aria-label={`${sideLabel} input`}
        className="editor-input"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <p className="field-error">{error.message}</p> : null}
    </section>
  );
};

export default CompareEditor;
```

- [ ] **Step 4: Wire app state and beautify behavior**

Replace `src/App.tsx` with:

```tsx
import { useState } from 'react';
import { beautifyJson } from './compare/jsonCompare';
import type { CompareMode, CompareSide, InputError } from './compare/types';
import CompareEditor from './components/CompareEditor';
import ModeSelector from './components/ModeSelector';
import './styles.css';

type EditorErrors = {
  left?: InputError;
  right?: InputError;
};

const App = () => {
  const [mode, setMode] = useState<CompareMode>('json');
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [errors, setErrors] = useState<EditorErrors>({});

  const handleModeChange = (nextMode: CompareMode) => {
    setMode(nextMode);
    setErrors({});
  };

  const handleBeautify = (side: CompareSide) => {
    const currentValue = side === 'left' ? leftText : rightText;
    const result = beautifyJson(currentValue, side);

    if (!result.ok) {
      setErrors((current) => ({ ...current, [side]: result.error }));
      return;
    }

    if (side === 'left') {
      setLeftText(result.value);
    } else {
      setRightText(result.value);
    }

    setErrors((current) => ({ ...current, [side]: undefined }));
  };

  const handleClear = (side: CompareSide) => {
    if (side === 'left') {
      setLeftText('');
    } else {
      setRightText('');
    }

    setErrors((current) => ({ ...current, [side]: undefined }));
  };

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Local browser tool</p>
          <h1>Text JSON Compare</h1>
        </div>
        <div className="top-actions">
          <ModeSelector mode={mode} onModeChange={handleModeChange} />
          <button className="primary-button" type="button">
            Compare
          </button>
        </div>
      </header>

      <section className="workspace" aria-label="Compare inputs">
        <CompareEditor
          side="left"
          title="Left"
          mode={mode}
          value={leftText}
          error={errors.left}
          onChange={setLeftText}
          onBeautify={() => handleBeautify('left')}
          onClear={() => handleClear('left')}
        />
        <CompareEditor
          side="right"
          title="Right"
          mode={mode}
          value={rightText}
          error={errors.right}
          onChange={setRightText}
          onBeautify={() => handleBeautify('right')}
          onClear={() => handleClear('right')}
        />
      </section>
    </main>
  );
};

export default App;
```

- [ ] **Step 5: Add workspace styling**

Replace `src/styles.css` with:

```css
:root {
  color: oklch(24% 0.018 250);
  background: oklch(97% 0.006 250);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  --surface: oklch(99% 0.004 250);
  --surface-muted: oklch(94% 0.008 250);
  --border: oklch(82% 0.018 250);
  --text: oklch(24% 0.018 250);
  --muted: oklch(48% 0.02 250);
  --accent: oklch(50% 0.14 250);
  --accent-muted: oklch(92% 0.035 250);
  --error: oklch(48% 0.16 28);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
textarea,
select {
  font: inherit;
}

button {
  transition: background-color 180ms ease-out, border-color 180ms ease-out, color 180ms ease-out;
}

.app-shell {
  width: min(1440px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 32px 0;
}

.top-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.top-actions {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1,
h2,
h3 {
  margin: 0;
  color: var(--text);
}

h1 {
  font-size: 1.85rem;
  line-height: 1.1;
}

h2 {
  font-size: 1rem;
}

.mode-selector {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.mode-selector select {
  min-width: 120px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  padding: 9px 10px;
}

.primary-button,
.secondary-button,
.ghost-button {
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

.primary-button {
  border: 0;
  background: var(--accent);
  color: oklch(98% 0.006 250);
  padding: 10px 16px;
}

.primary-button:hover {
  background: oklch(45% 0.15 250);
}

.secondary-button {
  border: 1px solid var(--border);
  background: var(--accent-muted);
  color: var(--accent);
  padding: 8px 12px;
}

.ghost-button {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  padding: 8px 12px;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

.editor-pane {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  padding: 16px;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.editor-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.editor-input {
  width: 100%;
  min-height: 360px;
  resize: vertical;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: oklch(98% 0.004 250);
  color: var(--text);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.92rem;
  line-height: 1.55;
  padding: 14px;
}

.editor-input:focus,
.mode-selector select:focus,
button:focus-visible {
  outline: 3px solid oklch(75% 0.09 250);
  outline-offset: 2px;
}

.field-error {
  margin: 10px 0 0;
  color: var(--error);
  font-size: 0.9rem;
  font-weight: 700;
}

@media (max-width: 820px) {
  .app-shell {
    width: min(100vw - 20px, 720px);
    padding: 20px 0;
  }

  .top-bar,
  .top-actions,
  .editor-header {
    align-items: stretch;
    flex-direction: column;
  }

  .workspace {
    grid-template-columns: 1fr;
  }

  .editor-actions {
    justify-content: flex-start;
  }
}
```

- [ ] **Step 6: Run UI tests to verify they pass**

Run: `npm run test -- src/App.test.tsx`

Expected: PASS with all app input workspace tests passing.

- [ ] **Step 7: Run full test suite and build**

Run: `npm run test && npm run build`

Expected: PASS for tests and build.

- [ ] **Step 8: Commit if the workspace is a git repo**

Run: `git rev-parse --is-inside-work-tree`

Expected in the current workspace: FAIL with `fatal: not a git repository`. Do not create a commit in that case.

If the command prints `true`, run:

```bash
git add src/App.tsx src/App.test.tsx src/components src/styles.css
git commit -m "feat: add compare input workspace"
```

---

### Task 5: Compare Action, JSON Results, Text Results, And Final Verification

**Files:**
- Create: `src/components/SummaryBar.tsx`
- Create: `src/components/ResultTokens.tsx`
- Create: `src/components/TextResults.tsx`
- Create: `src/components/JsonResults.tsx`
- Replace: `src/App.test.tsx`
- Replace: `src/App.tsx`
- Replace: `src/styles.css`

**Interfaces:**
- Consumes: `compareJson(leftInput, rightInput)` and `JsonCompareResult` success data.
- Consumes: `compareText(leftInput, rightInput)` and `TextCompareResult` success data.
- Produces: `SummaryBar({ summary })`.
- Produces: `JsonResults({ result })` with path summary and side-by-side highlighted JSON lines.
- Produces: `TextResults({ result })` with aligned line rows and token highlights.

- [ ] **Step 1: Extend UI tests for compare results and validation**

Replace `src/App.test.tsx` with:

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App input workspace', () => {
  it('renders JSON mode with two beautify buttons', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /text json compare/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/compare mode/i)).toHaveValue('json');
    expect(screen.getAllByRole('button', { name: /beautify json/i })).toHaveLength(2);
  });

  it('hides beautify buttons in text mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText(/compare mode/i), 'text');

    expect(screen.queryByRole('button', { name: /beautify json/i })).not.toBeInTheDocument();
  });

  it('beautifies one JSON pane independently', async () => {
    const user = userEvent.setup();
    render(<App />);

    fireEvent.change(screen.getByLabelText(/left input/i), { target: { value: '{"name":"Ada"}' } });
    fireEvent.change(screen.getByLabelText(/right input/i), { target: { value: '{"name":"Grace"}' } });
    await user.click(screen.getByRole('button', { name: /beautify json for left/i }));

    expect(screen.getByLabelText(/left input/i)).toHaveValue('{\n  "name": "Ada"\n}');
    expect(screen.getByLabelText(/right input/i)).toHaveValue('{"name":"Grace"}');
  });

  it('shows an inline error for invalid JSON beautify without changing input', async () => {
    const user = userEvent.setup();
    render(<App />);

    fireEvent.change(screen.getByLabelText(/left input/i), { target: { value: '{bad' } });
    await user.click(screen.getByRole('button', { name: /beautify json for left/i }));

    expect(screen.getByLabelText(/left input/i)).toHaveValue('{bad');
    expect(screen.getByText(/^Left JSON is invalid:/)).toBeInTheDocument();
  });

  it('clears only the selected pane', async () => {
    const user = userEvent.setup();
    render(<App />);

    fireEvent.change(screen.getByLabelText(/left input/i), { target: { value: 'left value' } });
    fireEvent.change(screen.getByLabelText(/right input/i), { target: { value: 'right value' } });
    await user.click(screen.getByRole('button', { name: /clear left/i }));

    expect(screen.getByLabelText(/left input/i)).toHaveValue('');
    expect(screen.getByLabelText(/right input/i)).toHaveValue('right value');
  });
});

describe('App compare results', () => {
  it('blocks JSON compare and shows the invalid side error', async () => {
    const user = userEvent.setup();
    render(<App />);

    fireEvent.change(screen.getByLabelText(/left input/i), { target: { value: '{"ok":true}' } });
    fireEvent.change(screen.getByLabelText(/right input/i), { target: { value: '{bad' } });
    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    expect(screen.getByText(/^Right JSON is invalid:/)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /compare results/i })).not.toBeInTheDocument();
  });

  it('shows JSON path summary and highlighted values after compare', async () => {
    const user = userEvent.setup();
    render(<App />);

    fireEvent.change(screen.getByLabelText(/left input/i), { target: { value: '{"user":{"name":"Ada"}}' } });
    fireEvent.change(screen.getByLabelText(/right input/i), { target: { value: '{"user":{"name":"Grace"}}' } });
    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    expect(screen.getByRole('region', { name: /compare results/i })).toBeInTheDocument();
    expect(screen.getByText('user.name')).toBeInTheDocument();
    expect(screen.getByText('Changed: 1')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Grace')).toBeInTheDocument();
  });

  it('shows text line and inline token differences after compare', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText(/compare mode/i), 'text');
    fireEvent.change(screen.getByLabelText(/left input/i), { target: { value: 'status: pending' } });
    fireEvent.change(screen.getByLabelText(/right input/i), { target: { value: 'status: approved' } });
    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    const results = screen.getByRole('region', { name: /compare results/i });

    expect(within(results).getByText('Changed: 1')).toBeInTheDocument();
    expect(within(results).getByText('pending')).toHaveClass('token-removed');
    expect(within(results).getByText('approved')).toHaveClass('token-added');
  });
});
```

- [ ] **Step 2: Run app tests to verify they fail**

Run: `npm run test -- src/App.test.tsx`

Expected: FAIL because result components and compare action are not implemented.

- [ ] **Step 3: Create reusable result components**

Create `src/components/SummaryBar.tsx`:

```tsx
import type { DiffSummary } from '../compare/types';

type SummaryBarProps = {
  summary: DiffSummary;
};

const SummaryBar = ({ summary }: SummaryBarProps) => {
  return (
    <div className="summary-bar" aria-label="Diff summary">
      <span>Added: {summary.added}</span>
      <span>Removed: {summary.removed}</span>
      <span>Changed: {summary.changed}</span>
    </div>
  );
};

export default SummaryBar;
```

Create `src/components/ResultTokens.tsx`:

```tsx
import type { TextToken } from '../compare/types';

type ResultTokensProps = {
  tokens: TextToken[];
};

const ResultTokens = ({ tokens }: ResultTokensProps) => {
  if (tokens.length === 0) {
    return <span className="empty-cell" aria-label="empty counterpart" />;
  }

  return (
    <>
      {tokens.map((token, index) => (
        <span key={`${token.text}-${index}`} className={`token token-${token.kind}`}>
          {token.text}
        </span>
      ))}
    </>
  );
};

export default ResultTokens;
```

Create `src/components/TextResults.tsx`:

```tsx
import type { TextCompareResult } from '../compare/types';
import ResultTokens from './ResultTokens';
import SummaryBar from './SummaryBar';

type TextResultsProps = {
  result: Extract<TextCompareResult, { ok: true }>;
};

const TextResults = ({ result }: TextResultsProps) => {
  return (
    <section className="results-panel" aria-label="Compare results">
      <div className="results-header">
        <h2>Text differences</h2>
        <SummaryBar summary={result.summary} />
      </div>
      <div className="text-result-grid" role="table" aria-label="Text diff rows">
        {result.rows.map((row) => (
          <div className={`text-result-row row-${row.kind}`} role="row" key={row.id}>
            <div className="line-number" aria-label="left line number">
              {row.leftLineNumber ?? ''}
            </div>
            <pre className="text-cell left-cell">
              <ResultTokens tokens={row.leftTokens} />
            </pre>
            <div className="line-number" aria-label="right line number">
              {row.rightLineNumber ?? ''}
            </div>
            <pre className="text-cell right-cell">
              <ResultTokens tokens={row.rightTokens} />
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TextResults;
```

Create `src/components/JsonResults.tsx`:

```tsx
import type { DiffKind, JsonCompareResult, JsonDiff, JsonValue } from '../compare/types';
import SummaryBar from './SummaryBar';

type JsonResultsProps = {
  result: Extract<JsonCompareResult, { ok: true }>;
};

type JsonLine = {
  path: string;
  text: string;
};

const JsonResults = ({ result }: JsonResultsProps) => {
  const leftLines = createJsonLines(result.normalizedLeft);
  const rightLines = createJsonLines(result.normalizedRight);

  return (
    <section className="results-panel" aria-label="Compare results">
      <div className="results-header">
        <h2>JSON differences</h2>
        <SummaryBar summary={result.summary} />
      </div>

      <div className="json-summary" aria-label="JSON path summary">
        {result.diffs.length === 0 ? (
          <p>No structural differences found.</p>
        ) : (
          <ul>
            {result.diffs.map((diff) => (
              <li key={`${diff.kind}-${diff.path}`}>
                <strong>{diff.path}</strong> {diff.kind}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="json-result-grid">
        <JsonLinePane title="Left formatted JSON" side="left" lines={leftLines} diffs={result.diffs} />
        <JsonLinePane title="Right formatted JSON" side="right" lines={rightLines} diffs={result.diffs} />
      </div>
    </section>
  );
};

type JsonLinePaneProps = {
  title: string;
  side: 'left' | 'right';
  lines: JsonLine[];
  diffs: JsonDiff[];
};

const JsonLinePane = ({ title, side, lines, diffs }: JsonLinePaneProps) => {
  return (
    <section className="json-pane" aria-label={title}>
      <h3>{title}</h3>
      <pre className="json-lines">
        {lines.map((line, index) => (
          <span className={`json-line ${jsonLineClass(line.path, side, diffs)}`} key={`${line.path}-${index}`}>
            {line.text}
            {'\n'}
          </span>
        ))}
      </pre>
    </section>
  );
};

const jsonLineClass = (path: string, side: 'left' | 'right', diffs: JsonDiff[]): string => {
  const diff = diffs.find((candidate) => pathMatchesDiff(path, candidate.path));

  if (!diff) {
    return '';
  }

  if (diff.kind === 'added' && side === 'left') {
    return '';
  }

  if (diff.kind === 'removed' && side === 'right') {
    return '';
  }

  const classByKind: Record<DiffKind, string> = {
    added: 'json-line-added',
    removed: 'json-line-removed',
    changed: 'json-line-changed',
  };

  return classByKind[diff.kind];
};

const pathMatchesDiff = (linePath: string, diffPath: string): boolean => {
  if (linePath === diffPath) {
    return true;
  }

  if (linePath === 'root') {
    return diffPath === 'root';
  }

  return diffPath.startsWith(`${linePath}.`) || diffPath.startsWith(`${linePath}[`);
};

const createJsonLines = (value: JsonValue, path = 'root', indent = 0, label?: string): JsonLine[] => {
  const prefix = '  '.repeat(indent);
  const labelPrefix = label ? `${JSON.stringify(label)}: ` : '';

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [{ path, text: `${prefix}${labelPrefix}[]` }];
    }

    const lines: JsonLine[] = [{ path, text: `${prefix}${labelPrefix}[` }];

    value.forEach((item, index) => {
      const childLines = createJsonLines(item, appendPath(path, index), indent + 1);
      if (index < value.length - 1) {
        childLines[childLines.length - 1].text += ',';
      }
      lines.push(...childLines);
    });

    lines.push({ path, text: `${prefix}]` });
    return lines;
  }

  if (isJsonObject(value)) {
    const keys = Object.keys(value).sort();

    if (keys.length === 0) {
      return [{ path, text: `${prefix}${labelPrefix}{}` }];
    }

    const lines: JsonLine[] = [{ path, text: `${prefix}${labelPrefix}{` }];

    keys.forEach((key, index) => {
      const childLines = createJsonLines(value[key], appendPath(path, key), indent + 1, key);
      if (index < keys.length - 1) {
        childLines[childLines.length - 1].text += ',';
      }
      lines.push(...childLines);
    });

    lines.push({ path, text: `${prefix}}` });
    return lines;
  }

  return [{ path, text: `${prefix}${labelPrefix}${JSON.stringify(value)}` }];
};

const appendPath = (path: string, segment: string | number): string => {
  const base = path === 'root' ? '' : path;

  if (typeof segment === 'number') {
    return `${base}[${segment}]` || `[${segment}]`;
  }

  if (/^[A-Za-z_$][\w$]*$/.test(segment)) {
    return base ? `${base}.${segment}` : segment;
  }

  return `${base}[${JSON.stringify(segment)}]`;
};

const isJsonObject = (value: JsonValue): value is Record<string, JsonValue> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export default JsonResults;
```

- [ ] **Step 4: Wire compare action in App**

Replace `src/App.tsx` with:

```tsx
import { useState } from 'react';
import { beautifyJson, compareJson } from './compare/jsonCompare';
import { compareText } from './compare/textCompare';
import type { CompareMode, CompareSide, InputError, JsonCompareResult, TextCompareResult } from './compare/types';
import CompareEditor from './components/CompareEditor';
import JsonResults from './components/JsonResults';
import ModeSelector from './components/ModeSelector';
import TextResults from './components/TextResults';
import './styles.css';

type EditorErrors = {
  left?: InputError;
  right?: InputError;
};

type ResultState =
  | { mode: 'json'; result: Extract<JsonCompareResult, { ok: true }> }
  | { mode: 'text'; result: Extract<TextCompareResult, { ok: true }> };

const App = () => {
  const [mode, setMode] = useState<CompareMode>('json');
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [errors, setErrors] = useState<EditorErrors>({});
  const [resultState, setResultState] = useState<ResultState | null>(null);

  const handleModeChange = (nextMode: CompareMode) => {
    setMode(nextMode);
    setErrors({});
    setResultState(null);
  };

  const handleBeautify = (side: CompareSide) => {
    const currentValue = side === 'left' ? leftText : rightText;
    const result = beautifyJson(currentValue, side);

    if (!result.ok) {
      setErrors((current) => ({ ...current, [side]: result.error }));
      return;
    }

    if (side === 'left') {
      setLeftText(result.value);
    } else {
      setRightText(result.value);
    }

    setErrors((current) => ({ ...current, [side]: undefined }));
  };

  const handleClear = (side: CompareSide) => {
    if (side === 'left') {
      setLeftText('');
    } else {
      setRightText('');
    }

    setErrors((current) => ({ ...current, [side]: undefined }));
    setResultState(null);
  };

  const handleCompare = () => {
    if (mode === 'json') {
      const result = compareJson(leftText, rightText);

      if (!result.ok) {
        setErrors({ left: result.leftError, right: result.rightError });
        setResultState(null);
        return;
      }

      setErrors({});
      setResultState({ mode: 'json', result });
      return;
    }

    const result = compareText(leftText, rightText);

    if (!result.ok) {
      setErrors({ left: result.leftError, right: result.rightError });
      setResultState(null);
      return;
    }

    setErrors({});
    setResultState({ mode: 'text', result });
  };

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Local browser tool</p>
          <h1>Text JSON Compare</h1>
        </div>
        <div className="top-actions">
          <ModeSelector mode={mode} onModeChange={handleModeChange} />
          <button className="primary-button" type="button" onClick={handleCompare}>
            Compare
          </button>
        </div>
      </header>

      <section className="workspace" aria-label="Compare inputs">
        <CompareEditor
          side="left"
          title="Left"
          mode={mode}
          value={leftText}
          error={errors.left}
          onChange={setLeftText}
          onBeautify={() => handleBeautify('left')}
          onClear={() => handleClear('left')}
        />
        <CompareEditor
          side="right"
          title="Right"
          mode={mode}
          value={rightText}
          error={errors.right}
          onChange={setRightText}
          onBeautify={() => handleBeautify('right')}
          onClear={() => handleClear('right')}
        />
      </section>

      {resultState?.mode === 'json' ? <JsonResults result={resultState.result} /> : null}
      {resultState?.mode === 'text' ? <TextResults result={resultState.result} /> : null}
    </main>
  );
};

export default App;
```

- [ ] **Step 5: Add final result styling and responsive polish**

Replace `src/styles.css` with:

```css
:root {
  color: oklch(24% 0.018 250);
  background: oklch(97% 0.006 250);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  --surface: oklch(99% 0.004 250);
  --surface-muted: oklch(94% 0.008 250);
  --border: oklch(82% 0.018 250);
  --text: oklch(24% 0.018 250);
  --muted: oklch(48% 0.02 250);
  --accent: oklch(50% 0.14 250);
  --accent-muted: oklch(92% 0.035 250);
  --added-bg: oklch(93% 0.06 150);
  --added-text: oklch(35% 0.11 150);
  --removed-bg: oklch(93% 0.05 28);
  --removed-text: oklch(39% 0.13 28);
  --changed-bg: oklch(93% 0.06 80);
  --changed-text: oklch(36% 0.09 80);
  --error: oklch(48% 0.16 28);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
textarea,
select {
  font: inherit;
}

button {
  transition: background-color 180ms ease-out, border-color 180ms ease-out, color 180ms ease-out;
}

.app-shell {
  width: min(1440px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 32px 0;
}

.top-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.top-actions {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1,
h2,
h3 {
  margin: 0;
  color: var(--text);
}

h1 {
  font-size: 1.85rem;
  line-height: 1.1;
}

h2 {
  font-size: 1rem;
}

h3 {
  font-size: 0.92rem;
}

.mode-selector {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.mode-selector select {
  min-width: 120px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  padding: 9px 10px;
}

.primary-button,
.secondary-button,
.ghost-button {
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

.primary-button {
  border: 0;
  background: var(--accent);
  color: oklch(98% 0.006 250);
  padding: 10px 16px;
}

.primary-button:hover {
  background: oklch(45% 0.15 250);
}

.secondary-button {
  border: 1px solid var(--border);
  background: var(--accent-muted);
  color: var(--accent);
  padding: 8px 12px;
}

.ghost-button {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  padding: 8px 12px;
}

.workspace,
.json-result-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

.editor-pane,
.results-panel,
.json-pane {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
}

.editor-pane {
  padding: 16px;
}

.editor-header,
.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.editor-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.editor-input {
  width: 100%;
  min-height: 360px;
  resize: vertical;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: oklch(98% 0.004 250);
  color: var(--text);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.92rem;
  line-height: 1.55;
  padding: 14px;
}

.editor-input:focus,
.mode-selector select:focus,
button:focus-visible {
  outline: 3px solid oklch(75% 0.09 250);
  outline-offset: 2px;
}

.field-error {
  margin: 10px 0 0;
  color: var(--error);
  font-size: 0.9rem;
  font-weight: 700;
}

.results-panel {
  margin-top: 20px;
  padding: 16px;
}

.summary-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-bar span {
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 800;
  padding: 6px 10px;
}

.json-summary {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: oklch(98% 0.004 250);
  margin-bottom: 16px;
  padding: 12px 14px;
}

.json-summary p,
.json-summary ul {
  margin: 0;
}

.json-summary ul {
  display: grid;
  gap: 6px;
  padding-left: 20px;
}

.json-pane {
  min-width: 0;
  padding: 12px;
}

.json-pane h3 {
  margin-bottom: 10px;
}

.json-lines,
.text-cell {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.86rem;
  line-height: 1.55;
}

.json-line {
  display: block;
  border-radius: 6px;
  min-height: 1.4em;
  padding: 0 4px;
}

.json-line-added,
.token-added,
.row-added .right-cell {
  background: var(--added-bg);
  color: var(--added-text);
}

.json-line-removed,
.token-removed,
.row-removed .left-cell {
  background: var(--removed-bg);
  color: var(--removed-text);
}

.json-line-changed,
.token-changed,
.row-changed .left-cell,
.row-changed .right-cell {
  background: var(--changed-bg);
  color: var(--changed-text);
}

.text-result-grid {
  display: grid;
  gap: 4px;
}

.text-result-row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 48px minmax(0, 1fr);
  gap: 8px;
  align-items: stretch;
}

.line-number {
  border-radius: 8px;
  background: var(--surface-muted);
  color: var(--muted);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.78rem;
  padding: 6px;
  text-align: right;
}

.text-cell {
  border-radius: 8px;
  background: oklch(98% 0.004 250);
  min-height: 34px;
  padding: 6px 8px;
}

.token {
  border-radius: 4px;
  padding: 1px 2px;
}

.token-equal {
  color: inherit;
}

.empty-cell::after {
  color: var(--muted);
  content: " ";
}

@media (max-width: 820px) {
  .app-shell {
    width: min(100vw - 20px, 720px);
    padding: 20px 0;
  }

  .top-bar,
  .top-actions,
  .editor-header,
  .results-header {
    align-items: stretch;
    flex-direction: column;
  }

  .workspace,
  .json-result-grid {
    grid-template-columns: 1fr;
  }

  .editor-actions {
    justify-content: flex-start;
  }

  .text-result-row {
    grid-template-columns: 40px minmax(0, 1fr);
  }

  .text-result-row .right-cell,
  .text-result-row .line-number:nth-of-type(2) {
    margin-top: 2px;
  }
}
```

- [ ] **Step 6: Run app tests to verify they pass**

Run: `npm run test -- src/App.test.tsx`

Expected: PASS with all app tests passing.

- [ ] **Step 7: Run compare engine tests**

Run: `npm run test -- src/compare/jsonCompare.test.ts src/compare/textCompare.test.ts`

Expected: PASS with JSON and text engine tests passing.

- [ ] **Step 8: Run full verification**

Run: `npm run test && npm run build`

Expected: PASS for the full test suite and production build.

- [ ] **Step 9: Manually inspect the app in desktop and mobile widths**

Run: `npm run dev`

Expected: Vite prints a local URL. Open the URL and confirm:

- JSON mode is selected by default.
- Left and right editors are side by side on desktop.
- Editors stack vertically below 820px viewport width.
- `Beautify JSON for Left` formats only the left pane.
- Invalid JSON displays an inline error under the affected editor.
- JSON compare shows summary counts, path summary, and highlighted formatted JSON lines.
- Text compare shows aligned side-by-side rows and highlights changed tokens.

- [ ] **Step 10: Commit if the workspace is a git repo**

Run: `git rev-parse --is-inside-work-tree`

Expected in the current workspace: FAIL with `fatal: not a git repository`. Do not create a commit in that case.

If the command prints `true`, run:

```bash
git add src/App.tsx src/App.test.tsx src/components src/styles.css
git commit -m "feat: render compare results"
```
