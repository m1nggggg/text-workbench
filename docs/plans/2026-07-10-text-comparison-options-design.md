# Text Comparison Options

Date: 2026-07-10

## Decision

Add two compact, explicit text-mode options to the workspace toolbar: **Ignore whitespace** and **Ignore case**. Ignore whitespace trims leading/trailing whitespace and collapses runs of spaces or tabs for matching; it does not remove all whitespace. Options are off by default so the existing exact comparison remains the baseline.

The alternatives were a settings drawer, which adds hidden state and navigation cost, and automatic inference, which could silently conceal meaningful differences. Persistent native-checkbox controls are easier to understand, keyboard-accessible, and consistent with a focused developer utility.

## Behavior and data flow

Normalization affects line matching only. Result rows retain the exact original text from both inputs, even when a row is considered equal under active rules. This separation prevents comparison policy from mutating evidence.

The options live in the framework-independent text comparison contract and are included in large-input worker messages. Changing an option cancels an active comparison, clears errors and stale results, and announces that the comparison rules changed. Text result messaging reports active ignored dimensions so a zero-difference result cannot be mistaken for byte-for-byte equality.

Flow: `raw line records → policy normalization for matching → aligned original records → inline tokens for non-ignored changes → result summary`.

## Error handling and testing

Options require no fallback path: unsupported or absent fields resolve to the exact-comparison defaults. Tests cover whitespace runs, leading/trailing whitespace, tabs, case, combined policies, preservation of original row text, default behavior, workspace invalidation, accessible checkbox state, and worker request compatibility.

## Impact analysis

- Direct: text comparison types/engine, worker request, workspace state, toolbar UI, text result messaging, tests.
- Indirect: identical-result copy and status language must no longer claim character equality when options are active.
- Risk: mistakenly rendering normalized text or treating word boundaries as removable. Both are addressed by retaining raw line records and collapsing rather than deleting whitespace.
