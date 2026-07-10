# Design system

The current design is a restrained diff workbench grounded in real editor conventions. It is intentionally flat, dense, and functional: no gradients, glass effects, oversized marketing copy, or decorative motion.

## Product principles

- Make the two inputs the dominant surface.
- Never show results for stale input.
- Use color, symbols, and text together for every diff state.
- Keep primary blue rare; reserve it for selection, focus, and Compare.
- Preserve exact text presentation with a monospace stack and line gutters.
- Prefer compact hairline structure over rounded card collections.
- Keep all data local and make that promise visible without turning it into marketing.

## Core tokens

| Role | Value |
|---|---|
| Canvas | `#0c0e11` |
| Panel | `#12151a` |
| Raised panel | `#181c22` |
| Editor | `#0e1115` |
| Border | `#292e37` |
| Primary text | `#edf0f4` |
| Muted text | `#949ca8` |
| Secondary text | `#757e8a` (4.60:1 on the editor surface) |
| Accent | `#4c96e8` |
| Added | `#55c894` on `#102a21` |
| Removed | `#ef7c82` on `#30171b` |
| Changed | `#d5ae67` on `#2b2417` |
| Error | `#ff969b` |

The interface uses 3–5 px radii, 1 px dividers, system UI type for chrome, and SF Mono/Cascadia/Consolas fallbacks for content.

## Layout

- A compact sticky top bar contains product identity, local-only status, mode tabs, and the primary action.
- A workspace toolbar owns actions that affect both inputs.
- Editors are side by side above 900 px and stack on smaller screens.
- Results use path-aligned rows for JSON and a horizontally scrollable aligned grid for text.
- Formatted JSON uses one aligned viewport so both sources scroll together; very large sources use synchronized lightweight panes.
- Large unchanged text runs collapse with three context lines around each change.
- Text result rows use a compact 27 px baseline to maximize useful diff density.

## Interaction

- `Cmd/Ctrl + Enter` compares.
- `Cmd/Ctrl + F` searches inside the focused editor.
- Arrow keys, Home, and End move between mode tabs.
- Tab inserts two spaces inside either editor.
- Editing, swapping, clearing, or changing mode cancels background work and removes stale results.
- Reduced-motion preferences disable animation and smooth scrolling.

## Accessibility

Inputs use viewport-rendered CodeMirror surfaces with persistent names, error relationships, invalid state, and live status feedback. Diff rows use symbols and labels in addition to color. Results expose valid ARIA table structure. Automated axe checks run for empty, JSON-result, and text-result states; contrast remains part of visual QA because jsdom has no layout engine.
