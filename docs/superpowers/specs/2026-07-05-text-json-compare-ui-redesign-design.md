# Text JSON Compare UI Redesign

> Historical design record. Superseded by `docs/plans/2026-07-10-production-compare-workspace-design.md`.

Date: 2026-07-05

Supersedes the visual direction in `2026-07-05-text-json-compare-design.md` and `DESIGN.md`/`PRODUCT.md`. Functional scope, architecture, and comparison logic from the original design doc are unchanged; this document covers UX/UI only.

## Summary

The current UI reads as generic AI-scaffolded output: a uniformly blue-tinted dark neutral palette, 8-12px rounded bordered cards, a boilerplate "eyebrow + title left, dropdown + button right" top bar, and large empty black textareas with no guidance. None of it is wrong, it is just anonymous, it could be any dashboard.

This redesign keeps the exact feature set (JSON mode, text mode, beautify, clear, compare) and re-grounds the visual and interaction design in a concrete anchor: a real code editor (VS Code/Monaco), which the target user already has open next to this tool. The interface should feel like an extension of that toolchain, not a separate flashy web app.

## Goals

- Replace reflexive "dark mode because dev tool" styling with a color system grounded in a real scene: a developer comparing JSON/config side by side with their actual editor open nearby.
- Introduce genuine editor conventions where they serve the task: line-number gutters on inputs, a tab control for mode switching, a status bar, diff-editor-style row coloring in results.
- Fix concrete UX gaps: guideless empty textareas, no "identical inputs" success state, inconsistent type scale.
- Preserve "earned familiarity" (product register): this must read as trustworthy and conventional to a developer, not experimental or decorative.

## Non-Goals

- No new features beyond the current set (no file upload, no export, no persistence, no search/filter within diffs). These remain future enhancements per the original design doc.
- No resizable split divider between panes (declined; pane split stays a fixed grid).
- No keyboard shortcut for Compare (declined; mouse/click remains the only trigger).
- No light theme / theme toggle (declined; dark-only, but a real editor dark theme rather than generic SaaS-dark).
- No restructuring of the comparison algorithms, data models, or file/module architecture described in the original design doc.

## Design Direction

**Color strategy:** Restrained (product default). Accent (editor blue) appears in exactly a few deliberate places: the active tab indicator, focus rings, the Compare button, and the status bar. It does not appear on every border, label, or secondary button.

**Theme scene sentence:** A developer has two JSON blobs or config files open, tabbed next to their actual code editor, at a normally-lit desk, focused and a little impatient. They want the diff fast, and they want it to feel like part of their existing toolchain, not a separate web app. This forces dark (matches editor chrome so it doesn't clash alongside VS Code), dense/precise layout (impatient), and a restrained accent (utility, not marketing).

**Anchor reference:** VS Code / Monaco editor, specifically its diff editor and status bar conventions. Not recreated literally (no fake title bar, no activity bar, no traffic-light dots), only the real, purposeful affordances: gutters, hairline dividers, a status bar, tabs.

**Creative north star:** "The Diff Editor" (replaces "The Terminal Console" from the original DESIGN.md, which named a mood without a concrete scene behind it).

## Design Tokens

Replaces the token values in `DESIGN.md`. Structure (OKLCH, semantic naming) stays; values change to de-genericize the palette and sharpen the editor feel.

### Color

| Token | Value | Use |
|---|---|---|
| `--canvas` | `oklch(15% 0.003 240)` | Page background |
| `--panel` | `oklch(19% 0.004 240)` | Editor panes, top bar, tab bar |
| `--elevated` | `oklch(23% 0.005 240)` | Status bar, active tab, open menus |
| `--gutter` | `oklch(17% 0.004 240)` | Line-number gutter background |
| `--border` | `oklch(27% 0.005 240)` | Hairline 1px dividers only |
| `--text` | `oklch(94% 0.002 240)` | Primary text |
| `--text-muted` | `oklch(65% 0.01 240)` | Labels, meta, gutter numbers |
| `--text-ghost` | `oklch(38% 0.01 240)` | Placeholder/example content in empty editors |
| `--accent` | `oklch(64% 0.16 240)` | Active tab indicator, focus ring, Compare button, status bar fill |
| `--accent-ink` | `oklch(18% 0.01 240)` | Text on accent background |
| `--added-bg` / `--added-fg` | `oklch(26% 0.05 150)` / `oklch(78% 0.14 150)` | Full-row added background / marker text |
| `--removed-bg` / `--removed-fg` | `oklch(24% 0.07 25)` / `oklch(74% 0.14 25)` | Full-row removed background / marker text |
| `--changed-bg` / `--changed-fg` | `oklch(22% 0.07 285)` / `oklch(76% 0.10 285)` | Full-row changed background / marker text |
| `--error` | `oklch(55% 0.18 25)` | Validation error text/icon |

Neutrals are no longer a single tint stamped across every layer: canvas, panel, elevated, and gutter each sit at a distinct step so structure comes from luminance layering, not borders.

### Radius

`sm: 2px`, `md: 3px`, `lg: 4px` (down from 6/8/12). Sharp, editor-like, not rounded-SaaS.

### Spacing

`2xs: 2px`, `xs: 4px`, `sm: 8px`, `md: 12px`, `lg: 16px`, `xl: 24px`, `2xl: 32px`. Finer steps than the current 4-value scale, so chrome density (tab bar, status bar, toolbar buttons) and content areas (editor padding) can have distinct, deliberate rhythm instead of one padding value everywhere.

### Typography

Consistent ~1.13-1.18 scale ratio (current scale jumps unevenly: 1.45x then nearly flat). Sizes shrink overall; this is a dense tool, not a marketing page.

| Role | Size | Weight |
|---|---|---|
| Label | 0.6875rem (11px), uppercase, +0.04em tracking | Bold |
| Body | 0.8125rem (13px) | Regular |
| Title | 0.9375rem (15px) | Medium |
| Headline | 1.0625rem (17px) | Semibold |
| Display | 1.25rem (20px) | Semibold |
| Editor/mono content | 0.8125rem (13px), line-height 1.6 | Regular |

Fonts unchanged: system-ui stack for chrome, SFMono/Consolas/Menlo stack for all editor and result content.

## Layout & Structure

- **Top bar**: app name at Title size (not an oversized Display headline dominating the bar), plus a two-way **tab control** for JSON / Text mode replacing the `<select>` dropdown. A dropdown is the wrong affordance for exactly two mutually exclusive options; tabs are standard and match the editor anchor. Compare remains the single primary action, right-aligned, using `--accent`.
- **Status bar** (new): a slim bar fixed to the bottom of the viewport, `--elevated` background. Shows current mode and per-pane line/character counts at rest. After Compare runs, it shows added/removed/changed counts here instead of a separate floating summary card. This is the one place the accent gets a filled background treatment, echoing a real editor status bar.
- **Input panes**: each gets a line-number gutter (`--gutter` background, `--text-muted` numbers) to the left of the textarea content, reinforcing the editor read even before any content exists. Beautify/Clear shrink from bordered pill buttons into a compact editor-toolbar treatment (smaller, tighter padding, no heavy border box).
- **Results / diff view**: full-row tinted backgrounds for added/removed/changed lines (not text-color-only tinting), aligned gutters on both sides, small +/- gutter markers alongside the color. The JSON path summary becomes a compact list with a small colored status dot plus the mono path, closer to an editor "Problems" list than a bullet list in a bordered card.
- **Cards vs dividers**: replace bordered "card" containers with hairline 1px dividers plus luminance steps between `--canvas` / `--panel` / `--elevated` wherever a divider alone communicates the boundary. Cards are no longer the default answer for "this is a section."

## Interaction Model

- **Tab switching**: click or arrow-key between JSON / Text tabs (standard tab keyboard behavior: arrow keys move focus, Enter/Space or auto-activation selects). Active tab gets a top-border accent indicator plus `--elevated` background.
- **Synced scrolling**: once both panes have content, scrolling either input pane scrolls the other to match (line-proportional). Same behavior applies between the two result panes in the diff view. This is direct-manipulation feedback, so it is immediate, not animated/eased.
- **Live JSON syntax highlighting**: while typing in JSON mode, keys/strings/numbers/booleans/null get subtle color differentiation in the input pane itself (not just in results). Text mode inputs stay plain (no syntax to highlight).
- **Beautify / Clear**: same behavior as today (independent per pane, never destroys invalid input on failure), restyled only.
- **Compare**: same trigger (click only, no shortcut per scope decision). Given comparisons are synchronous and fast for realistic input sizes, no loading state is required; results appear immediately below/within the workbench.
- **Motion**: 150-250ms, state-conveying only (tab indicator slide, focus ring transition, result rows fading in on compare). No animation on layout-affecting properties. Synced scroll and typing highlight are not animated, they are immediate.

## Key States

| State | Behavor |
|---|---|
| Empty pane | Gutter present but empty; faint `--text-ghost` example content (e.g. a short example JSON snippet or "Paste JSON here...") so the pane reads as an idle editor, not a broken void. |
| Typing (JSON mode) | Live syntax color differentiation as content is entered. |
| Validation error | Inline under the affected editor, `--error` color, small icon + message (slightly more presence than today's plain colored text, still restrained, no popup/toast). |
| Comparing | Instant; no separate loading state needed given client-side, synchronous computation. |
| Results with differences | Diff-editor row coloring (full-row backgrounds + gutter markers), synced scroll, status bar shows summary counts. |
| **Results, identical inputs (new)** | A clear, calm "No differences found" confirmation state instead of an empty-looking or ambiguous results area. Currently unhandled; this redesign adds it explicitly. |

## Component-Level Mapping

No new files beyond what's needed for the tab control and status bar; existing modules are restyled/extended, not replaced.

- `App.tsx`: top bar restructure (tabs instead of `ModeSelector` dropdown, status bar mount point).
- `ModeSelector.tsx`: becomes a tab control (same props/contract: mode value + onChange), rendered as two-way tabs instead of `<select>`.
- `CompareEditor.tsx`: adds gutter (line numbers), ghost placeholder content, live JSON syntax highlighting (JSON mode only), restyled toolbar buttons.
- `SummaryBar.tsx`: logic moves into the new status bar; component either becomes the status bar's summary segment or is retired in favor of it. Added/removed/changed counts and colors carry over unchanged.
- `JsonResults.tsx` / `TextResults.tsx`: row-level styling changes to full-row diff backgrounds + gutter markers, add synced-scroll wiring, JSON summary list restyled to the "Problems"-style compact list. Underlying data contracts (`compare/types.ts`, `jsonCompare.ts`, `textCompare.ts`) are unchanged.
- `ResultTokens.tsx`: token color mapping updated to new diff token values; rendering logic unchanged.
- `styles.css`: token values updated per Design Tokens above; new rules for gutter, tab control, status bar, ghost placeholder, JSON input syntax highlighting.

## Responsive Behavior

- Desktop: side-by-side panes (unchanged breakpoint approach), tab bar and Compare button stay inline in the top bar, status bar spans full width fixed to viewport bottom.
- Mobile (existing ~820px breakpoint): panes stack vertically (unchanged). Status bar becomes a compact single-row summary (mode + result counts only, drop per-pane live counts) to avoid crowding a narrow viewport; still bottom-fixed.
- Gutters remain visible at all sizes; they do not collapse on mobile, since line reference matters as much on a phone as a desktop for this tool.

## Accessibility

- Maintain WCAG AA contrast for all new token values (verify `--text-ghost` against `--panel`/`--gutter`, and diff foreground colors against their new full-row backgrounds specifically, since backgrounds are now larger/more prominent than the current text-tint-only treatment).
- Tab control uses proper ARIA tab/tablist/tabpanel roles and arrow-key navigation, not a bare clickable div pair.
- Status bar result counts update in a way assistive tech can announce (e.g. `aria-live="polite"` on the summary segment), consistent with the current inline error announcements.
- Gutter line numbers are decorative relative to content; mark them `aria-hidden` and ensure textarea content remains the accessible source of truth.
- Respect `prefers-reduced-motion` for tab indicator/focus/result fade-in transitions, consistent with current behavior.

## Testing Plan (additions to existing suite)

- Tab control: switching modes via click and via arrow keys updates active mode and ARIA state correctly.
- Gutter: line-number count matches actual line count in each pane, including on paste and on Clear.
- Empty state: ghost placeholder is present when a pane is empty and disappears once real content exists, and is never submitted as real input on Compare.
- JSON syntax highlighting: does not alter the underlying textarea value; plain-text paste in Text mode is never colorized.
- Synced scroll: scrolling one pane updates the other's scroll position proportionally, in both input and results views.
- Identical-input state: comparing two identical JSON or text inputs renders the new "No differences found" state rather than an empty or misleading results area.
- Existing JSON/text compare, beautify, and validation tests continue to pass unchanged (comparison logic is untouched).

## Explicitly Deferred (raised during design, not in this scope)

- Resizable divider between panes.
- Keyboard shortcut to trigger Compare.
- Click-to-jump from the JSON "Problems"-style summary list to the corresponding line in results.
- Light theme / theme toggle.

## Open Questions

- Exact ghost placeholder copy/example content for empty JSON vs Text panes (small copy detail, resolve during implementation).
- Whether the mobile status bar should be dismissible/collapsible if it visually crowds very small viewports in practice (resolve after implementation, based on how it looks at the smallest supported width).
