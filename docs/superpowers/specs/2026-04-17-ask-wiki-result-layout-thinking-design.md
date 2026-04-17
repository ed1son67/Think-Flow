# Ask Wiki Result Layout And Thinking Panel Design

## Goal

Refine the Ask Wiki result route so the page feels like a focused analysis workspace:

- the left side remains the primary work area
- the answer stays visually anchored in the lower portion of the left column
- status is merged into the result surface instead of living in a separate panel
- process visibility becomes a collapsible `Thinking` section inside the result
- the right side is dedicated to citation documents and can be folded per item

The page should feel more coherent and more assistant-like without pretending to expose raw model chain-of-thought.

## Scope

This design covers:

- the `/ask-wiki` route layout
- restructuring of the left control and result surfaces
- replacing the standalone process panel with an inline `Thinking` section
- right-rail citation presentation and collapse behavior
- light motion for running and expand/collapse states

This design does not cover:

- exposing raw Codex internal reasoning
- changes to backend task orchestration
- multi-task history
- citation ranking changes
- docs page layout outside `/ask-wiki`

## User Intent

The desired interaction model is:

- keep the question composer on the left
- keep the answer on the left and visually lower in the composition
- move supporting evidence to the right
- let users inspect how the answer is being formed without cluttering the main answer

The user explicitly wants `Status` and `Result` merged, with the process shown as part of `Thinking`, including motion and collapse behavior.

## Constraints

- The project already has an Ask Wiki route and query lifecycle in `site/src/components/ask-wiki/ask-wiki-page.tsx`.
- Existing query status and process events already exist as structured UI state and should be reused.
- The interface must not claim to show raw model internal reasoning.
- Motion should remain restrained and consistent with the existing site direction.
- The implementation should avoid new dependencies.

## Product Direction

The page should read as a two-pane analysis workspace:

- left: question, mode, actions, answer, and optional reasoning context
- right: citation documents only

The result card becomes the primary focal object. It should communicate current state, show the final answer clearly, and reveal intermediate reasoning only when useful.

The `Thinking` presentation should feel like an assistant activity trace, but it must be framed as a readable process summary derived from available status and evidence events.

## Layout

The layout should use a two-column desktop structure:

- left column: wider primary work surface
- right column: narrower evidence rail

Inside the left column:

1. Question composer and mode controls stay at the top.
2. The result card occupies the dominant vertical space below.
3. The result card visually emphasizes its lower half so the answer feels anchored toward the lower-left area.

The previous standalone `Process` and `Sources` cards in the left sidebar should be removed from that position.

On smaller screens, the layout should stack in this order:

1. question composer
2. result card
3. references rail

## Result Card

The result card should combine:

- current task state
- result mode badge
- optional task id metadata
- `Thinking` disclosure
- final answer body
- inline error state when present

The card header should provide compact status context. This replaces the need for a separate status panel.

The answer body remains the most readable element in the card. Status and process context support it; they do not compete with it.

## Thinking Panel

`Thinking` is a collapsible subpanel inside the result card.

Its purpose is to show a safe, user-readable reasoning trace, not raw chain-of-thought.

The content should be built from existing UI-visible events such as:

- queued or running state changes
- search matches found
- documents selected or used
- summary prepared
- failure or retry transitions

The presentation should favor concise, evidence-aware descriptions such as:

- `Searching wiki pages`
- `Matched 3 relevant pages`
- `Using deployment design doc and query panel spec`
- `Synthesizing answer from selected references`

This gives the user visibility into the answer-building process without exposing hidden internal reasoning.

## Thinking States

Running state:

- `Thinking` is expanded by default
- the header shows active motion, such as a pulsing dot or subtle shimmer
- new items can appear progressively as process events arrive

Completed state:

- `Thinking` remains available as a disclosure
- default behavior should be `expanded while running, collapsed after completion`
- the collapsed state should still show a short summary, for example step count or last completed action

Failed state:

- `Thinking` should stay expanded or be easy to reopen so the failure path is visible
- error messaging remains separate and more prominent than the trace summary

## Right Reference Rail

The right side should be dedicated to citation documents.

Each reference item should behave like a foldable document card or accordion row:

- collapsed state shows title and repo path
- expanded state shows a short excerpt, metadata, or relevant context
- only one item needs to be expanded at a time, though independent expansion is also acceptable if implementation is simpler

The right rail should feel like an evidence panel, not a duplicate answer surface.

The left result card may keep lightweight source chips for quick orientation, but the full source browsing experience belongs on the right.

## Motion

Motion should remain restrained:

- `Thinking` header uses subtle live-state emphasis while running
- expand/collapse uses short height and opacity transitions
- process items can fade or slide in lightly
- reference accordions open with a small, fast reveal

Avoid:

- typewriter output effects
- large panel movement
- long stagger sequences that delay comprehension

Reduced motion must disable large animated transitions while preserving state clarity.

## Data Mapping

The current frontend state already provides most inputs needed:

- `status`
- `statusDetail`
- `processItems`
- `sourceItems`
- `output`
- `error`

The design should reinterpret these states rather than introduce a new backend contract.

Likely mapping:

- `processItems` feeds `Thinking`
- `status` and `statusDetail` feed the result header
- `sourceItems` feed the right reference rail

If helpful, the UI can derive a compact `thinking summary` string from the latest process items.

## Accessibility And Usability

- `Thinking` and each reference section should use semantic button-driven disclosure controls.
- Expanded/collapsed state must be screen-reader accessible.
- Motion should respect `prefers-reduced-motion`.
- Important status and error text should remain visible outside collapsed regions when needed.

## Risks

- If `Thinking` is too verbose, it will compete with the answer instead of supporting it.
- If the motion is too strong, the interface will feel unstable during streaming.
- If the right rail shows too little information, it becomes decorative; if it shows too much, it overwhelms the answer.
- Users may misinterpret `Thinking` as literal chain-of-thought unless wording is careful.

## Success Criteria

The work is successful when:

- the Ask Wiki route reads as a two-pane workspace
- the left side keeps question controls and the result together
- status no longer needs its own separate panel
- process appears as a collapsible `Thinking` section inside the result card
- `Thinking` feels informative during execution and unobtrusive after completion
- the right rail is clearly dedicated to foldable citation documents
- the UI does not imply exposure of raw internal model reasoning
