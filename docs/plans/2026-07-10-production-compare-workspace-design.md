# Production Compare Workspace Design

Date: 2026-07-10

Editor implementation note: the native input surface described below was subsequently replaced by the viewport-rendered CodeMirror adapter in [the production editor design](2026-07-10-codemirror-editor-design.md). The surrounding workspace decisions remain current.

## Product direction

The product is a private, browser-only workbench for developers, QA engineers, and operators comparing JSON payloads, configuration, logs, and prose. It should feel like a focused editor rather than a dashboard: sharp geometry, neutral graphite surfaces, compact controls, deliberate green/red/amber diff colors, and no gradients or decorative effects. The primary loop is paste or drop content, compare with one click or keyboard shortcut, understand the result, and navigate or copy what matters.

The editor shell stays native for this iteration. It adds synchronized line-number gutters, tab insertion, drag-and-drop/file import, copy/clear/format actions, line and byte statistics, explicit examples, and useful empty states without introducing a large editor runtime. The component boundary remains narrow enough to replace with CodeMirror later if measured input sizes require viewport virtualization or syntax-aware editing.

## Functional design

- JSON and Text are first-class tabs, with JSON as the default.
- Inputs can be pasted, typed, dropped, or loaded from a file; processing never leaves the browser.
- `Cmd/Ctrl+Enter` compares from anywhere in the workspace. Tab inserts two spaces inside an editor.
- JSON panes support formatting and show parse failures without modifying invalid content.
- A central workspace toolbar swaps inputs, loads a representative example, and clears both panes.
- Editing invalidates old results immediately so the output can never silently describe stale input.
- Results show an explicit identical state, compact change counts, paged large JSON results, and aligned source context.
- JSON results prioritize a precise path table with before/after values and retain formatted source panes for context.
- Text results align line numbers and inline tokens. Large unchanged runs collapse to context rows and can be expanded.
- Diff states use text labels and symbols in addition to color.

## Architecture and data flow

Comparison remains framework-independent under `src/compare`. React components own only interaction and rendering. Shared result types are explicit discriminated unions; errors are returned with side and message rather than swallowed. Editor file and clipboard operations expose failures to a live status region.

Data flow:

1. Raw left/right state is updated by text entry or file input.
2. Any input edit clears the prior result and field error for that side.
3. Compare validates both sides for the active mode.
4. The selected comparison engine returns a normalized result model.
5. Results render a semantic summary plus mode-specific details.
6. Navigation moves focus/scroll to change rows without changing the diff model.

Large result rendering uses collapsed unchanged runs and `content-visibility` for rows. Comparison remains explicit rather than live to protect typing responsiveness. Execution duration is measured and reported as product feedback, not as a performance guarantee.

## Impact analysis

### Direct impact

- `src/App.tsx`: workspace orchestration, shortcuts, files, status, examples, swapping, stale result handling.
- `src/components/CompareEditor.tsx`: production editor shell, line gutter, statistics, file/drop interactions.
- `src/components/ModeSelector.tsx`: accessible tab control.
- `src/components/JsonResults.tsx`: path-centric aligned results and source context.
- `src/components/TextResults.tsx`: context collapsing, semantic columns, and navigable change rows.
- `src/components/SummaryBar.tsx`: clearer semantic status.
- `src/compare/textCompare.ts`: preserve and correctly classify blank lines and final newline differences.
- `src/compare/types.ts`: shared product-facing result metadata where needed.
- `src/styles.css`: replace generic card styling with the editor workbench system.
- tests: broaden engine and interaction coverage.

### Indirect impact

- Clipboard and File APIs require safe, visible error handling and test doubles.
- Existing accessible names change when the dropdown becomes tabs; tests must assert the new public interaction.
- JSON source rendering must avoid implying that parent containers themselves changed when only descendants changed.

### Risk assessment

- High: blank-line/final-newline correctness in the line diff; change-row alignment.
- Medium: drag/drop and clipboard behavior across browsers; dense mobile diff layout.
- Low: visual tokens, counters, examples, swap/clear actions.

## Verification

- Unit tests cover JSON normalization/path handling and text blank lines, final newlines, additions, removals, and inline changes.
- Component tests cover tabs, independent formatting/clearing, examples, swap, keyboard compare, validation, and identical/different results.
- TypeScript build and Vitest must pass with no suppressed errors.
- Browser QA covers desktop and mobile layouts, keyboard focus, empty/error/success/difference states, scrolling, and drag affordances.
- A production build is inspected for output size and runtime console errors.
