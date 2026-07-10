# Text JSON Compare

A fast, private comparison workbench for structured JSON and line-based text. Everything runs locally in the browser; input is never uploaded or persisted.

## Highlights

- Structural JSON comparison that ignores whitespace and object-key order.
- Intelligent array alignment that avoids cascading false changes after insertions or removals.
- Path-level JSON results with before/after values and formatted source context.
- Line-aligned text results with word and character highlights, blank-line support, and final-newline detection.
- Optional whitespace and case normalization that never rewrites the displayed source text.
- One aligned, shared-scroll JSON source viewport with synchronized lightweight panes for very large documents.
- Large unchanged text runs collapse around useful context.
- Viewport-rendered CodeMirror editors with JSON highlighting, bracket matching, undo/redo, local search, line gutters, and two-space Tab insertion.
- File open/drop, copy, format, clear, swap, examples, and byte/line statistics.
- `Cmd/Ctrl + Enter` comparison and keyboard-complete JSON/Text mode tabs.
- Inputs above 750,000 characters compare in a cancellable Web Worker to keep the interface responsive.
- Accessible status, errors, diff labels, focus navigation, and reduced-motion support.

## Development

Requires Node.js `^20.19`, `^22.12`, or `>=24`.

```bash
npm install
npm run dev
npm test
npm run build
```

`npm run check` runs the complete test and production-build gate. The test suite covers comparison correctness, user workflows, accessibility structure, large-result presentation, and performance guardrails.

## Architecture

- `src/compare/` contains framework-independent parsing, alignment, comparison, tokenization, and worker routing.
- `src/hooks/useCompareWorkspace.ts` coordinates product state and cancels stale background work.
- `src/components/` contains focused editor and result views.
- `src/product/examples.ts` owns representative sample content.

See [the production editor design](docs/plans/2026-07-10-codemirror-editor-design.md) and [workspace design](docs/plans/2026-07-10-production-compare-workspace-design.md) for the current product and technical decisions. Earlier documents under `docs/superpowers/` are historical records.

## Privacy and limits

The app has no backend, analytics, storage, or network request path for comparison content. File reads use the browser File API and are limited to 25 MB per file as a safety guard. Pasted content is not artificially capped; large comparisons are moved off the UI thread.
