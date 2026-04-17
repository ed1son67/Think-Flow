# Home And Ask Wiki Motion Design

## Goal

Improve the frontend's perceived responsiveness and friendliness by adding restrained motion to the home page and by turning Ask Wiki into a clearer primary interaction.

The motion should make the site feel more intentional without making it noisy, slow, or fragile.

## Scope

This design covers:

- lightweight entrance and hover/press motion on the home page
- a refined global Ask Wiki entry point
- a dedicated Ask Wiki result page at `/ask-wiki`
- an origin-aware transition from the floating Ask Wiki button into the result page
- loading, streaming, success, and error states for the Ask Wiki result experience
- reduced-motion handling

This design does not cover:

- changes to the docs route UI
- persistent query history
- multi-task management
- a new animation library
- visual redesign beyond what is needed to support the motion system

## Constraints

- The project already has an active Next.js frontend under `site/` and an existing global Ask Wiki panel flow.
- The repository already contains in-progress Ask Wiki work, so this change must layer on top of that shape rather than re-invent the query backend.
- The user explicitly wants a light, restrained motion style.
- The Ask Wiki result should feel like it expands from the floating entry point, not like an unrelated page jump.
- The implementation should avoid adding dependencies and should stay easy to maintain.

## Product Direction

The motion system should communicate three things:

- the home page is alive and responsive
- clickable surfaces react immediately
- Ask Wiki is a first-class workflow, not a secondary utility drawer

The site should still feel like a knowledge product. Motion should support orientation and feedback rather than calling attention to itself.

## Home Page Motion

The home page keeps the same information architecture and visual language.

Motion is limited to:

- one-time entry motion for the hero shell, hero copy, and summary cards
- one-time entry motion for the knowledge overview section and latest-pages section
- hover and press feedback for primary buttons, secondary buttons, and cards
- subtle emphasis shifts for icon and text color on interactive surfaces

The motion profile should be short and controlled:

- entrance motion uses fade plus small upward translation
- hover motion uses slight lift and shadow strengthening
- press motion uses a fast settle-down effect
- no looping decorative animations on the home page

## Home Page Sequencing

Home page elements should appear in a readable order:

1. Hero shell
2. Hero text block
3. Hero CTAs
4. Hero stat cards in short stagger
5. Wiki overview lane
6. Latest pages lane
7. Footer

The sequence should complete quickly so the page feels polished rather than delayed. The target is a compact cascade, not a cinematic intro.

## Ask Wiki Entry Point

The floating Ask Wiki control remains global and fixed to the lower-right corner.

Its role changes:

- it becomes a clear launcher, not the full result surface
- it shows light hover and press feedback
- it can still reveal a compact pre-launch state for context if needed
- its primary action is to open the dedicated Ask Wiki route

The global entry point should feel persistent and trustworthy, not dominant.

## Ask Wiki Result Route

Ask Wiki gets its own route:

```text
/ask-wiki
```

This route becomes the main place to:

- edit or submit a question
- show current task status
- stream answer content
- show failures and recovery actions

The result page should preserve the site's existing tone but read as a focused work surface rather than a generic document page.

## Transition Model

The defining interaction is the transition from the floating Ask Wiki button into the result page.

The transition should work like this:

1. User activates the floating Ask Wiki entry.
2. The button expands into a small origin panel at the same screen position.
3. That panel rapidly grows into a viewport-filling transition layer.
4. The app lands on `/ask-wiki`.
5. The result page content appears in layers after the shell is established.

This preserves the causal relationship between trigger and destination.

The effect should be implemented as a shell transition, not as a heavy content animation.

## Ask Wiki Page Motion

Once the shell transition completes, the Ask Wiki page should animate in lightly:

- page heading and question composer appear first
- task status row appears next
- result container appears after that

Streaming content should not use a typewriter effect. The output area should remain stable while content grows naturally.

This avoids visual churn during long responses and keeps the experience tool-like.

## State Model

The Ask Wiki route should support these states:

- idle
- queued
- starting
- running
- completed
- failed

State presentation rules:

- idle shows the composer and a calm empty result area
- queued and starting show visible progress context without blocking the page
- running keeps the result container stable and scrollable
- completed emphasizes result readability
- failed keeps the question visible and offers a clear retry path

The result page should own the query lifecycle UI. The global floating button should not continue rendering the full task state once the route is active.

## Routing And Data Flow

The existing Ask Wiki task model should remain the backend source of truth.

The frontend should be split into two layers:

- a global launcher layer that records or passes transition intent
- a route layer that manages question input, task creation, stream subscription, and output display

If a user launches Ask Wiki from the home page, the result route should initialize in an expanded state and, when possible, preserve the launch origin for transition rendering.

Direct navigation to `/ask-wiki` must still work even when no origin coordinates are available. In that case the page should fall back to a normal lightweight page entrance.

## Reduced Motion

The implementation must honor `prefers-reduced-motion`.

Reduced-motion behavior should:

- remove large scale and position transitions
- remove stagger timing that slows comprehension
- keep simple opacity and color transitions where helpful
- preserve all functional states and hierarchy

The Ask Wiki route must remain fully usable without motion.

## Styling Boundaries

The motion system should be implemented with the project's existing CSS and component structure.

Preferred tools:

- CSS transitions
- CSS keyframes for short entrance motion
- minimal client-side state only where transition origin data is required

Avoid:

- introducing Framer Motion or similar libraries
- scattering one-off animation rules across many files
- tying motion to fragile layout assumptions

## File Shape

Expected implementation areas:

- `site/src/app/globals.css` for reusable motion tokens and utility classes
- home page components for applying stagger and interactive surface classes
- Ask Wiki global launcher component for source-origin capture
- a new `site/src/app/ask-wiki/` route for the dedicated result experience

The final code should keep the global launcher and the result page clearly separated so the Ask Wiki flow can evolve without reworking the entire shell.

## Risks

- Origin-based route transitions can become brittle if they rely on exact layout measurements or race the route change.
- Too much stagger or translation would make the site feel slower rather than friendlier.
- Mixing panel-era state management with route-era state management could duplicate logic if responsibilities are not separated cleanly.

## Success Criteria

The work is successful when:

- the home page feels more responsive through restrained motion and clearer interaction feedback
- the home page content hierarchy remains unchanged and readable
- Ask Wiki can be launched from the floating entry point into `/ask-wiki`
- the transition preserves a clear sense that the route grew from the floating launcher
- running, success, and error states are stable on the Ask Wiki route
- reduced-motion users get the same functionality without disruptive animation
