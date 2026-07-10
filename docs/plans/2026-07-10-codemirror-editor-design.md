# Production editor design

## Goal

Replace the hand-built textarea and line-number gutter with a production editor surface while preserving the compare workspace's existing behavior, visual language, accessibility, and local-only data handling.

## Boundary

`CompareEditor` remains responsible for the pane shell: file loading, drag and drop, copy, JSON formatting, clearing, error presentation, and input statistics. A new `CodeEditor` adapter owns only the editable document surface.

The adapter accepts a controlled string value, comparison mode, accessible label and description, error state, and change callback. It creates one CodeMirror view per pane and synchronizes external values into the existing document instead of remounting the view. External replacements are excluded from undo history.

## Editor behavior

- Use CodeMirror 6 directly, with the standard setup and a small application theme.
- Enable JSON language support only in JSON mode through a reconfigurable compartment.
- Keep plain text mode syntax-neutral.
- Preserve two-space tab insertion, line numbers, selection, undo/redo, bracket matching, active-line feedback, and standard in-editor search with Cmd/Ctrl+F.
- Let Cmd/Ctrl+Enter bubble to the workspace's existing compare shortcut so one handler always reads the latest input state.
- Do not run JSON validation on every keystroke. Explicit compare and format actions remain the source of parse errors, avoiding duplicate messaging and expensive whole-document work.
- Keep horizontal scrolling rather than wrapping long source lines.

## Visual design

The editor uses the existing neutral dark tokens, compact monospace typography, a restrained cyan focus indicator, and existing added/removed colors. The CodeMirror gutter replaces the custom React-generated gutter so line numbering scales with the visible viewport instead of the whole document.

## Accessibility

Each editor exposes a named textbox, `aria-invalid`, and the existing error description. Focus remains visible. Search uses CodeMirror's keyboard-accessible panel. Pane controls keep their current labels and order.

## Performance and failure policy

CodeMirror's viewport rendering removes the full-document line-number DOM cost. Controlled synchronization compares the current document before dispatching to prevent update loops. No silent alternate editor is introduced: initialization defects must be visible during development and tests instead of producing divergent behavior.

The accepted production build target is less than 200 kB gzip across the application JavaScript entry and any editor chunks. Existing worker-based large JSON comparison remains unchanged.

## Verification

- Adapter tests cover typing synchronization, external replacement, JSON-mode reconfiguration, two-space Tab, and Cmd/Ctrl+Enter.
- Workspace tests use the real CodeMirror view rather than a textarea mock.
- Existing accessibility scans pass in input, JSON-result, and text-result states.
- Full lint, test, typecheck, production build, dependency audit, and bundle-size review pass.
- Rendered desktop and responsive checks are attempted with the approved in-app browser; tool unavailability is reported rather than bypassed.
