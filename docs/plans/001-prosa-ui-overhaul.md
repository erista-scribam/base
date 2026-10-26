# Scribo Prosa — Visual Design Refinement

## Objective

Refine the existing Scribo Prosa desktop application into an exceptionally polished, professional writing environment.

The design direction is inspired by the restraint of Apple software, the typographic sophistication of iA Writer, and the precision of excellent native macOS applications.

The objective is not to imitate any single product. It is to achieve the same level of design discipline: understated, elegant, deliberate, coherent, and nearly invisible when the user is concentrating on writing.

**The application should feel like a carefully designed instrument for serious writers, not a generic SaaS dashboard, a web application inside a desktop window, or a developer prototype.**

The product's defining principle remains unchanged: Scribo controls presentation so that writers can concentrate on content.

## 1. Inspect Before Modifying

Before making changes, inspect the existing implementation.

Understand:

- The current application structure and component hierarchy.
- The existing design system, Tailwind configuration, and CSS architecture.
- The editor framework and its rendering behavior.
- The current document navigation, toolbar, menus, and editing surface.
- The existing theme and typography configuration.
- The Tauri desktop integration and platform-specific behavior.

Run the application and inspect its actual appearance if the available tools permit it.

Identify the most important visual inconsistencies and interaction problems before implementing changes.

Preserve all existing working functionality, document behavior, keyboard shortcuts, persistence, and architectural boundaries.

Do not rebuild the application from scratch merely to achieve a different appearance.

## 2. Design Direction

The visual language should combine four qualities.

### A. Apple-level restraint

- Minimal visual noise.
- Clear visual hierarchy.
- Generous but purposeful whitespace.
- Carefully balanced proportions.
- Subtle, restrained separators.
- Consistent alignment.
- No unnecessary decorative elements.
- No gratuitous gradients, glows, or shadows.
- No excessive rounded cards or floating containers.

Every visible element must justify its presence.

### B. iA Writer-inspired concentration

- The manuscript is the visual center of the application.
- The interface should recede when the user begins writing.
- Typography should feel literary, comfortable, and carefully tuned.
- Editor controls should be quiet and unobtrusive.
- Focus mode should remove distractions without compromising usability.
- Long-form reading and editing must remain comfortable over extended sessions.

### C. Professional desktop conventions

The application must feel like desktop software rather than a website.

Use appropriate platform conventions for:

- Window layout and resizing.
- Native window controls and title-bar integration.
- Keyboard shortcuts.
- Context menus.
- Dialogs and file operations.
- Focus states.
- Application menus.
- Scrolling and selection.
- Light and dark appearances.

Respect operating-system conventions where appropriate instead of unnecessarily recreating native functionality.

### D. Editorial sophistication

The design should communicate the quality of a premium literary tool.

Use typography, spacing, proportions, and carefully controlled contrast to establish sophistication.

Avoid relying on visual decoration to make the interface appear expensive.

## 3. Establish a Coherent Design System

Before styling individual components, define a consistent set of design tokens.

### Color

Use a restrained neutral palette.

Light appearance:

- Warm or neutral off-white application surfaces.
- A clearly defined manuscript canvas.
- Dark, readable text.
- Muted secondary text.
- Subtle borders.
- A restrained accent color used only where it communicates meaning.

Dark appearance:

- Carefully selected charcoal surfaces rather than indiscriminate pure black.
- Comfortable text contrast.
- Subtle differentiation between application chrome and manuscript canvas.
- Consistent semantic colors and interaction states.

Avoid excessive surface differentiation. The application should not look like a collection of cards.

### Typography

Establish a clear distinction between interface typography and manuscript typography.

Interface typography should be compact, highly legible, and restrained.

Manuscript typography should prioritize extended reading, appropriate line length, comfortable line height, and a strong literary character.

Define reusable tokens for:

- Interface font family.
- Interface font sizes and weights.
- Manuscript font family.
- Manuscript font sizes and line heights.
- Heading hierarchy.
- Letter spacing where appropriate.
- Text and secondary-text colors.

Use system fonts where they provide the best native experience. If bundled typefaces are justified, choose a small, deliberate selection with appropriate licensing.

Do not use typography as decoration.

### Spacing and dimensions

Establish consistent spacing tokens and apply them throughout the interface.

Pay particular attention to:

- Sidebar width.
- Toolbar height.
- Editor top and bottom padding.
- Manuscript maximum width.
- Paragraph spacing.
- Heading spacing.
- Distances between controls.
- Menu and popover padding.

Use a coherent spacing scale instead of arbitrary values scattered throughout CSS.

### Borders, shadows, and radii

Prefer subtle borders and tonal differentiation over shadows.

Use rounded corners sparingly and consistently. Avoid making every component a rounded rectangle.

Reserve shadows for elements that genuinely need elevation, such as floating menus or dialogs.

## 4. Redesign the Main Application Layout

Refine the main writing workspace into three clearly defined regions.

### A. Navigation sidebar

The sidebar should provide access to the manuscript and its structure without dominating the interface.

Requirements:

- Restrained visual styling.
- Clear document and section hierarchy.
- Elegant selected and hover states.
- Consistent indentation.
- Minimal icon usage.
- Carefully tuned text truncation.
- Comfortable keyboard navigation.
- Appropriate resizing behavior, if supported.
- A clear way to collapse or reveal the sidebar.

Avoid a conventional enterprise-dashboard sidebar.

The navigation should feel like a natural part of a writing application.

### B. Main editor

The manuscript must dominate the visual composition.

Requirements:

- A comfortable reading column with a deliberate maximum width.
- Consistent horizontal alignment.
- Generous but not excessive vertical whitespace.
- Carefully tuned paragraph spacing and line height.
- A clear visual hierarchy for headings.
- Restrained cursor and selection styling.
- Natural scrolling behavior.
- Minimal interface chrome around the text.
- A visually calm empty-document state.

Do not stretch prose across the entire window simply because the window is wide.

The manuscript should remain comfortable to read on large desktop displays.

Avoid placing the editor inside an unnecessary card or heavily bordered container.

The editing surface should feel like a clean sheet of paper integrated into the application.

### C. Toolbar and contextual controls

The toolbar should contain only controls that are useful in the current context.

Requirements:

- Small, consistent icons.
- Clear tooltips.
- Restrained spacing.
- Consistent control dimensions.
- Subtle active states.
- Accessible keyboard focus.
- No unnecessary labels when an icon is sufficiently recognizable.
- No icons whose meaning is ambiguous.

Do not fill the toolbar with controls simply because they exist.

Keep advanced or infrequently used actions in appropriate menus.

## 5. Refine the Writing Experience

The visual design must support the actual act of writing.

Implement or refine the following where compatible with the existing architecture.

### Focus mode

Provide a distraction-reduced editing mode that minimizes navigation and toolbar prominence.

Do not introduce unnecessary animations or completely change the manuscript's typography when entering focus mode.

The transition should feel natural and immediate.

### Cursor and selection

Carefully tune:

- Cursor visibility.
- Text selection colors.
- Active editor states.
- Keyboard focus indicators.
- Selection behavior across supported document elements.

Ensure selection remains accessible and visually distinct in both light and dark appearances.

### Empty states

Empty documents should feel intentional rather than unfinished.

Use restrained guidance that helps users begin writing without adding illustrations, promotional messaging, or excessive instructions.

### Menus and dialogs

Refine all menus, popovers, and dialogs to match the overall visual language.

Ensure consistent positioning, spacing, typography, borders, and interaction behavior.

Avoid introducing custom UI for functionality already provided well by the operating system.

### Motion

Use animation only when it clarifies a transition or improves perceived continuity.

Keep transitions subtle and brief.

Respect reduced-motion preferences where applicable.

Do not animate ordinary typing, scrolling, or document layout unnecessarily.

## 6. Preserve Scribo's Product Philosophy

Scribo is a structured writing environment, not a general-purpose word processor.

The redesign must preserve these constraints:

- No arbitrary font sizes on individual paragraphs.
- No arbitrary typefaces on individual blocks.
- No local margin or spacing overrides.
- No uncontrolled presentation styles pasted into the manuscript.
- Global typography changes must affect the appropriate elements consistently.
- Document structure must remain semantic.
- Visual presentation must remain separate from canonical document content.

The interface should make these constraints feel natural rather than restrictive.

Do not introduce new formatting capabilities merely to make the editor resemble another application.

## 7. Component and CSS Architecture

Keep the implementation maintainable.

- Reuse existing shared components where appropriate.
- Extract repeated styling into design tokens and shared components.
- Keep component responsibilities clear.
- Avoid unnecessary component abstraction.
- Avoid large collections of arbitrary CSS overrides.
- Remove obsolete styles introduced by the previous design.
- Avoid duplicating styles between light and dark themes.
- Keep application chrome styling separate from manuscript rendering styles.
- Preserve the shared package boundaries in the monorepo.

Do not put all styling into one enormous stylesheet.

Do not introduce a new UI framework or styling library unless a specific limitation justifies it.

Prefer refining the existing stack over replacing working infrastructure.

## 8. Accessibility and Interaction Quality

A professional appearance must not compromise usability.

Verify:

- Readable contrast in both themes.
- Visible keyboard focus.
- Logical tab order.
- Accessible names for icon-only controls.
- Usable tooltips.
- Adequate interactive target sizes.
- Keyboard navigation throughout the application.
- Appropriate behavior at different window sizes.
- Respect for system appearance and reduced-motion preferences.

Do not remove visible focus indicators simply to achieve a cleaner appearance.

## 9. Visual Quality Assurance

After implementation, run the application and evaluate the actual result.

Inspect at minimum:

1. A newly opened, empty manuscript.
2. A long manuscript with several heading levels.
3. A manuscript containing quotations, inline emphasis, and scene breaks.
4. The application with the sidebar open and collapsed.
5. Light and dark appearances.
6. A narrow window and a large desktop window.
7. Focus mode.
8. Menus, dialogs, hover states, and keyboard focus states.

Look specifically for:

- Misaligned elements.
- Inconsistent spacing.
- Excessive visual density.
- Unnecessary borders.
- Poor text contrast.
- Awkward line lengths.
- Unbalanced whitespace.
- Typography that feels generic or poorly tuned.
- Controls that look like web-dashboard components.
- Layout shifts while editing.
- Broken selection, scrolling, or keyboard interaction.

Correct the issues discovered during this inspection.

Do not declare the redesign complete merely because the application compiles.

If screenshots or other visual inspection tools are available, use them to assess the rendered application rather than judging the result exclusively from source code.

## 10. Implementation Strategy

Work in deliberate stages.

**Stage 1 — Audit**

Inspect the existing interface, identify inconsistencies, and establish the design direction.

**Stage 2 — Design tokens**

Define the color system, typography, spacing, radii, borders, and component dimensions.

**Stage 3 — Application shell**

Refine the window layout, sidebar, toolbar, and general interface hierarchy.

**Stage 4 — Manuscript presentation**

Refine the editor canvas, prose typography, headings, paragraphs, selections, and cursor.

**Stage 5 — Interaction polish**

Refine menus, dialogs, tooltips, focus mode, hover states, and transitions.

**Stage 6 — Verification**

Run type checks, linting, tests, and the application itself. Inspect the actual interface and fix visual or functional regressions.

Do not stop after Stage 2 or deliver only a design specification. Implement the changes.

Do not attempt to change the entire application in one uncontrolled pass. Make coherent changes, verify them, and continue.

## 11. Constraints

- Do not rewrite the application from scratch.
- Do not remove working features.
- Do not modify the canonical document schema without a concrete requirement.
- Do not introduce a backend service or cloud dependency.
- Do not add AI-writing features.
- Do not add unnecessary illustrations or decorative assets.
- Do not imitate Apple's proprietary interface details mechanically.
- Do not use gradients, shadows, blur, or rounded cards as substitutes for sound visual hierarchy.
- Do not sacrifice accessibility for aesthetics.
- Do not claim to have visually tested something that was not actually inspected.

Use professional design judgment to make reasonable decisions without asking for approval on every color, margin, or component.

## Definition of Done

The redesign is complete when Scribo Prosa feels visually coherent, typographically sophisticated, restrained, and purpose-built for serious writing.

Every component should appear intentional. The interface should remain quiet while the manuscript remains prominent. Light and dark appearances should both feel fully designed. Interactions should be predictable, and the existing product functionality should continue working.

The final result should evoke the quality and restraint of premium native desktop software without looking like a clone of any particular product.

**The guiding principle: the interface should be beautifully designed, but the writing should always be the most important thing on the screen.**
