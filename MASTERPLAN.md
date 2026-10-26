# Scribam — Project Foundation & Architecture

## 1. Project Overview

Build **Scribam**, a family of opinionated, structured writing applications designed to let writers focus on their work instead of formatting.

Scribam is the parent brand. Each product serves a particular writing form and enforces the conventions appropriate to that form.

The first product is **Scribam Prosa**, a dedicated environment for prose-based writing, including novels, short stories, essays, memoirs, and other prose manuscripts.

Future products may include:

- **Scribam Drama** — screenplays, stage plays, and dramatic scripts.
- **Scribam Versus** — poetry, verse, and line-oriented literary compositions.
- **Scribam Academia** — academic papers, theses, and scholarly manuscripts.

These future products are part of the architectural vision, not part of the initial implementation scope.

## 2. Core Product Philosophy

For writer-centred product direction, see **`docs/product/philosophy.md`** and **`docs/product/roadmap.md`** (plan 003 **execution** is tracked in **`docs/plans/active/003-prosa-deep-writing-features.md`**—phases 2–7 not started). For engineering workflow, see **`docs/engineering/operating-model.md`** and **`AGENTS.md`**.

Scribam separates content, document structure, and presentation.

The writer controls the content and its semantic structure. The application controls the visual presentation according to explicit, consistent rules.

The product must not behave like a general-purpose word processor.

Writers must not be able to arbitrarily change the font, font size, margins, paragraph spacing, or other presentation properties of individual elements.

Changing a typography setting must update the corresponding presentation globally rather than insert local formatting overrides.

The application should feel minimal, predictable, keyboard-friendly, and reliable.

The strictness must be enforced by the document model and editing commands, not merely by hiding formatting controls in the interface.

## 3. Technology Stack

Use the following technologies and keep their responsibilities clearly separated.

### Desktop application

- Tauri 2 for the desktop application shell.
- Rust for the native backend, operating-system integration, and native capabilities.
- React for the user interface.
- TypeScript with strict type checking for frontend and domain logic.
- Vite for frontend development and bundling.

Use the operating system's native webview through Tauri. Do not introduce Electron.

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui where appropriate
- A mature structured rich-text editing framework, selected after evaluating its ability to enforce a constrained document schema.

Do not implement a rich-text editor from scratch unless there is a demonstrated technical requirement that existing frameworks cannot satisfy.

### Backend

- Rust
- Tauri commands for explicitly defined frontend-to-native operations.
- A local-first persistence architecture.
- SQLite may be used for metadata, document indexing, or revision history where appropriate, but do not introduce a database without a clear architectural justification.

### Development tools

- pnpm workspaces
- TypeScript strict mode
- ESLint
- Prettier
- Vitest
- Rust formatting and linting through rustfmt and Clippy

Pin and document compatible toolchain versions. Do not assume that an unverified dependency or API exists.

## 4. Monorepo Architecture

Create a pnpm-based monorepo with a clear distinction between applications, shared packages, and native code.

Use the following as the initial target structure. Adjust only where a documented technical constraint requires it.

    scribam/
    ├── apps/
    │   └── prosa/
    │       ├── src/
    │       │   ├── app/
    │       │   ├── components/
    │       │   ├── editor/
    │       │   ├── features/
    │       │   ├── hooks/
    │       │   ├── styles/
    │       │   └── main.tsx
    │       ├── src-tauri/
    │       │   ├── src/
    │       │   ├── capabilities/
    │       │   ├── Cargo.toml
    │       │   └── tauri.conf.json
    │       ├── index.html
    │       ├── package.json
    │       ├── tsconfig.json
    │       └── vite.config.ts
    │
    ├── packages/
    │   ├── core/
    │   │   ├── src/
    │   │   └── package.json
    │   ├── document-model/
    │   │   ├── src/
    │   │   └── package.json
    │   ├── editor/
    │   │   ├── src/
    │   │   └── package.json
    │   ├── rendering/
    │   │   ├── src/
    │   │   └── package.json
    │   ├── design-system/
    │   │   ├── src/
    │   │   └── package.json
    │   └── export/
    │       ├── src/
    │       └── package.json
    │
    ├── Cargo.toml
    ├── pnpm-workspace.yaml
    ├── package.json
    ├── tsconfig.base.json
    ├── .editorconfig
    ├── .gitignore
    ├── CONTRIBUTING.md
    └── README.md

This is a logical starting point, not a requirement to create empty packages with no immediate purpose. Create each package only when it has a defined responsibility.

Keep the Tauri application configuration, permissions, and native commands inside the relevant application's `src-tauri` directory. Shared Rust crates may be introduced under a dedicated `crates/` directory if genuine cross-application native functionality emerges.

## 5. Package Responsibilities

### `@scribam/core`

Framework-independent domain primitives and contracts.

Responsibilities:

- Shared domain types.
- Document identifiers and metadata contracts.
- Validation interfaces.
- Domain errors.
- Versioning primitives where justified.

Constraints:

- No dependency on React, Tauri, the DOM, or browser APIs.
- No filesystem, network, or database I/O.
- No dependency on a particular persistence implementation.

### `@scribam/document-model`

Defines the canonical structured document representation.

Responsibilities:

- Document schemas and node types.
- Prose-specific document structures.
- Serialization and deserialization.
- Schema validation.
- Schema and format versioning.
- Migration interfaces.

The document model must represent semantic structure rather than rendered HTML or arbitrary style properties.

### `@scribam/editor`

Provides the shared editor integration and reusable editing primitives.

Responsibilities:

- Structured editor integration.
- Supported editing commands.
- Selection and keyboard interaction.
- Schema enforcement.
- Integration between the editing framework and the canonical document model.

Keep product-specific policies configurable without allowing arbitrary document formatting.

### `@scribam/rendering`

Defines how semantic document elements become visual output.

Responsibilities:

- Typography tokens.
- Paragraph and heading styles.
- Theme configuration.
- Reading and editing presentation.
- Shared rendering rules.

Rendering must not mutate the source document.

### `@scribam/design-system`

Provides shared UI components and visual tokens.

Responsibilities:

- UI primitives.
- Application-level layout components.
- Consistent controls and interaction patterns.
- Shared visual conventions across Scribam products.

Keep domain logic out of this package.

### `@scribam/export`

Defines export interfaces and format-specific implementations.

Responsibilities:

- Export contracts.
- Document-to-output transformations.
- Export validation.
- Format-specific adapters.

Keep export logic independent of the React interface. Implement formats incrementally rather than building every export target immediately.

## 6. Canonical Document Model

Define a typed, versioned document model.

The initial Prosa schema should support:

### Block elements

- Heading levels 1 through 5.
- Paragraphs.
- Block quotations.
- Scene breaks.
- Lists, if justified by the initial requirements.

### Inline elements

- Plain text.
- Bold.
- Italic.
- Underline.
- Hyperlinks, if justified.

Support additional semantic elements only when they have a clear use case.

Do not encode headings as paragraphs with manually enlarged fonts. Do not encode scene breaks as arbitrary strings of punctuation. Do not persist presentation-specific CSS as the authoritative document representation.

Use stable document identifiers where needed for structural elements and future revision tracking.

Treat imported HTML, Markdown, and DOCX as external representations that must be converted into the canonical model.

The canonical schema must be independent of the editor library. The editor library is an implementation detail, not the authoritative definition of a Scribam manuscript.

## 7. Presentation and Typography

The system must distinguish three layers.

### Editor theme

Controls the application interface, editor canvas, background, interface typography, and focus mode.

### Manuscript style

Controls the presentation of semantic elements, including:

- Typeface.
- Font size.
- Line height.
- Paragraph indentation.
- Paragraph spacing.
- Heading hierarchy.
- Quote styling.
- Scene-break appearance.

Changing a global style must update all corresponding elements consistently.

### Export profile

Controls output-specific properties, such as:

- Page size.
- Page margins.
- Page numbering.
- Running headers and footers.
- Chapter-opening rules.
- Export-specific typography and pagination.

Export settings must not modify the canonical document.

Do not implement full pagination in the first milestone. Establish the separation of concerns and implement a basic rendering configuration first.

## 8. Persistence and Data Safety

Scribam is local-first.

The initial application must be usable without an account, network connection, or cloud service.

Establish clear interfaces for:

- Creating and opening manuscripts.
- Saving documents.
- Autosaving.
- Recovering unsaved work after an abnormal shutdown.
- Importing and exporting documents.
- Managing schema migrations.

Saving must be reliable and failure-aware. Do not silently discard unsaved content.

Treat persistence as a separate infrastructure concern rather than coupling it to React components or editor state.

Do not implement Google Drive synchronization in the initial milestone. The architecture should permit future cloud-storage adapters without making cloud storage a prerequisite for editing.

## 9. Engineering Standards

Follow these rules throughout the repository.

1. Enable strict TypeScript checks.
2. Avoid `any`; use explicit domain types and safe narrowing.
3. Keep domain logic independent of UI frameworks and infrastructure.
4. Avoid circular dependencies between packages.
5. Define and enforce dependency direction.
6. Do not create generic abstractions without a concrete use case.
7. Do not duplicate the document schema across frontend, backend, and export implementations.
8. Keep Rust commands small and explicitly typed.
9. Apply least-privilege Tauri permissions.
10. Add unit tests for document validation, serialization, migrations, and domain behavior.
11. Add integration tests for persistence and editor commands where practical.
12. Document architectural decisions that materially constrain future development.

Do not introduce authentication, subscriptions, collaboration, analytics, AI-writing features, or cloud synchronization merely to make the architecture appear complete.

## 10. Initial Milestone

The first milestone is a working architectural foundation, not a fully featured writing application.

Implement the following:

1. Initialize the pnpm monorepo.
2. Configure a working Tauri 2, Rust, React, and TypeScript application under `apps/prosa`.
3. Establish shared TypeScript configuration, linting, formatting, and testing.
4. Create the initial `@scribam/core` and `@scribam/document-model` packages.
5. Define and test the initial Prosa document schema.
6. Create a minimal application shell with a document navigation area and editing area.
7. Integrate a structured editor that accepts only supported document elements.
8. Implement a minimal global typography configuration.
9. Add basic local document persistence if the schema and editor integration are stable enough.
10. Document how to install dependencies, run the desktop application, run tests, and build the application.

The application must launch successfully and demonstrate the architecture working end to end.

Do not attempt to implement DOCX import, PDF export, cloud synchronization, or the complete product feature set in this milestone.

## 11. Required Deliverables

Produce:

- The complete initial repository structure.
- Working workspace and application configuration.
- A running desktop application.
- The initial canonical document schema.
- Tests for the document model.
- A dependency diagram or concise architecture document.
- A README containing setup and development instructions.
- A list of architectural decisions and known limitations.

## 12. Execution Instructions

Before writing substantial implementation code:

1. Inspect the current repository and its existing conventions.
2. Confirm the current compatible versions and APIs of the selected frameworks.
3. Propose the final package boundaries and dependency direction.
4. Identify any necessary changes to the target directory structure.
5. Implement the initial milestone incrementally.

After each major step, run the relevant type checks, linting, tests, and build commands. Resolve failures before proceeding.

Do not claim that a command or test passed unless it was actually executed and its result verified.

If a design decision materially affects future compatibility or data integrity, explain the trade-offs before committing to it.

Prioritize a small, coherent, testable foundation over generating large amounts of boilerplate.

The guiding principle is:

**Scribam owns the structure of the writing. The application owns its presentation.**
