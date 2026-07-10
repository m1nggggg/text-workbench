# Text and JSON Compare Web App Design

> Historical design record. Superseded by `docs/plans/2026-07-10-production-compare-workspace-design.md`.

Date: 2026-07-05

## Summary

Build a local-only web app for comparing JSON and plain text. The app prioritizes easy visual inspection of differences, with a desktop-first side-by-side layout. Users manually choose JSON or Text mode, paste content into left and right editors, then click Compare.

The first version is intentionally focused: paste-only input, no backend, no saved history, no sharing, and no file upload.

## Goals

- Make JSON differences easy to understand through structural comparison and path-based summaries.
- Make text differences easy to pinpoint through aligned side-by-side output and word or character highlights.
- Keep all comparison work in the browser so pasted content is not uploaded anywhere.
- Give users explicit control through a mode selector and Compare button.
- Provide per-pane JSON beautification with clear invalid JSON errors.

## Non-Goals

- File upload or drag-and-drop input.
- Backend-powered comparison.
- Saved comparisons, sharing links, accounts, or persistence.
- Live comparison while typing.
- Collaboration or commenting features.

## Target Users

The first version targets developers, QA testers, and technical users who need to compare JSON payloads, API responses, config snippets, logs, and plain text quickly without sending data to a server.

## Primary User Flow

1. User opens the app.
2. User selects JSON or Text mode.
3. User pastes left and right content.
4. In JSON mode, user may click Beautify JSON for either pane.
5. User clicks Compare.
6. App validates input for the selected mode.
7. App renders a summary and side-by-side highlighted results.

## Architecture

The app should be a static, client-side web application. Vite, React, and TypeScript are a suitable stack because the app needs interactive editors, isolated compare modules, and browser-only deployment.

Core modules:

- `compare-json`: Parses both inputs, normalizes JSON structures, ignores whitespace and object key order, and returns path-based differences.
- `compare-text`: Compares raw text by line, then highlights changed words or characters inside changed lines.
- `diff-model`: Defines shared result types for added, removed, changed, unchanged, parse errors, and summary counts.
- `editor-ui`: Owns the left and right paste editors, labels, actions, and validation display.
- `result-ui`: Renders the summary, JSON path list, and side-by-side highlighted output.

The comparison logic must stay separate from React components so it can be unit tested without rendering the UI.

## JSON Mode

JSON mode is structural, not raw text comparison.

Behavior:

- Both inputs must parse as JSON before comparison.
- Whitespace differences are ignored.
- Object key order differences are ignored.
- Arrays preserve index order and report paths like `items[2]`.
- Object differences report paths like `user.name` or `settings.theme`.
- Added, removed, and changed values are categorized separately.
- Results show a path summary and side-by-side formatted JSON with changed values highlighted.

Root values may be objects, arrays, strings, numbers, booleans, or null. The UI should support any valid JSON root while making object and array comparison the primary use case.

## JSON Beautify

Each JSON input pane has its own Beautify JSON button.

Behavior:

- Beautify parses only the pane where the user clicked the button.
- If parsing succeeds, the app replaces that pane content with consistently indented JSON.
- If parsing fails, the app keeps the original text unchanged.
- Invalid JSON errors appear inline under the affected editor.
- Beautify actions for left and right panes are independent.
- Compare in JSON mode should block if either pane is empty or invalid.

## Text Mode

Text mode treats all input as raw text. It does not validate JSON and does not parse content.

Behavior:

- Compare by line first so added, removed, and changed lines are easy to scan.
- Within changed lines, highlight changed words first. If a changed word needs finer detail, highlight the changed characters inside that word.
- Render results side by side. Unchanged and changed lines should align across panes; added or removed lines should render with an empty counterpart row.
- Empty input should show a friendly required message for the affected side.

## UI Design

The interface is a single workspace optimized for desktop use.

Main regions:

- Top bar: app name, JSON/Text mode selector, Compare button.
- Input area: left and right editors shown side by side on desktop.
- Editor actions: Clear for both modes; Beautify JSON appears in JSON mode.
- Validation area: inline error messages under the relevant editor.
- Results area: summary counts followed by detailed side-by-side results.

Responsive behavior:

- Desktop: left and right panes sit side by side.
- Mobile: panes stack vertically, preserving labels and actions.

Visual direction:

- Product UI register: design serves the task and should feel reliable rather than decorative.
- Use a neutral, readable surface with restrained accent color.
- Use strong monospace rendering for pasted content and results.
- Use clear colors for added, removed, and changed highlights with accessible contrast.
- Avoid decorative motion and unnecessary visual complexity.

## Data Flow

1. User selects JSON or Text mode.
2. User edits left and right content.
3. In JSON mode, Beautify JSON attempts to parse and format one pane at a time.
4. User clicks Compare.
5. App validates inputs according to mode.
6. Compare module returns a normalized diff model.
7. UI renders summary counts and detailed results.
8. Errors are displayed inline and do not erase user input.

## Error Handling

- Invalid JSON shows an inline error under the affected editor.
- JSON parse errors should include the native parse message. Position details are optional and should only appear if the chosen parser provides them reliably.
- Beautify never destroys invalid input.
- JSON compare is blocked until both panes parse successfully.
- Empty inputs show required messages.
- Text mode accepts any text, including invalid JSON.
- Large inputs are compared only on explicit Compare click to avoid sluggish typing.

## Testing Plan

JSON compare tests:

- Same JSON with different whitespace returns no differences.
- Same object with different key order returns no differences.
- Changed nested value returns the correct path.
- Added and removed object keys are reported.
- Array additions, removals, and changes are reported with index paths.
- Invalid JSON returns a validation error and does not compare.

Beautify tests:

- Valid compact JSON formats consistently.
- Invalid JSON keeps the original text and returns an error.
- Left and right beautify actions work independently.

Text compare tests:

- Added lines are highlighted.
- Removed lines are highlighted.
- Changed lines are highlighted.
- Changed words or characters inside a changed line are highlighted.
- Empty input validation works.

UI smoke tests:

- User can paste left and right content, choose mode, click Compare, and see results.
- JSON invalid error appears under the correct editor.
- Desktop layout shows side-by-side panes.
- Mobile layout stacks panes vertically.

## Suggested Future Enhancements

- File upload and drag-and-drop for `.json`, `.txt`, and `.log` files.
- Search and filter within differences.
- Collapse unchanged sections.
- Copy or export diff results.
- Optional auto-detect mode.
- Optional live compare toggle for smaller inputs.
