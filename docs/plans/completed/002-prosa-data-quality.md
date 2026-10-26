# Scribo Prosa — Reliability, Data Integrity, and Crash Recovery

## Objective

Harden the existing Scribo Prosa application against data loss, document corruption, editing bugs, crashes, failed saves, and performance degradation.

Scribo is a desktop writing application built with Tauri 2, Rust, React, TypeScript, and pnpm workspaces.

The application's most important responsibility is preserving the user's manuscript accurately and reliably.

A writer must be able to trust Scribo with months or years of work. Data integrity and predictable editing behavior take precedence over new features, visual polish, and implementation convenience.

**Do not assume the application currently has these defects. Audit the implementation, identify actual risks, and address them systematically.**

## 1. Inspect the Existing Repository

Before modifying code:

1. Inspect the monorepo structure, package boundaries, and dependency graph.
2. Identify the editor framework and understand its document-state and transaction model.
3. Trace the complete manuscript lifecycle:
   - Document creation.
   - Editing and state updates.
   - Autosave scheduling.
   - Serialization.
   - Disk persistence.
   - Document reopening.
   - Recovery after abnormal termination.
   - Schema migration.
   - Import and export.
4. Identify every source of manuscript state, including editor state, React state, caches, pending writes, and persisted data.
5. Inspect the Rust backend, Tauri commands, filesystem permissions, and error handling.
6. Inspect existing tests and identify missing coverage.
7. Run the existing type checks, linting, tests, and build commands to establish a baseline.

Document the highest-risk findings and their locations before making substantial changes.

Preserve the existing architecture wherever possible. Do not rewrite the editor, replace dependencies, or introduce a database without a concrete justification.

## 2. Establish Document Integrity Invariants

Define and enforce the following invariants.

- The canonical document model is the authoritative representation of manuscript content.
- The editor must never silently discard valid user content.
- Every persisted document must be valid for its declared schema version.
- Every successful save must correspond to a known document revision.
- Older asynchronous save operations must never overwrite newer committed revisions.
- Failed saves must not be reported as successful.
- Unsupported or corrupted documents must never be silently replaced with empty documents.
- Schema migrations must preserve content and metadata.
- Formatting annotations and future linguistic analysis must not modify manuscript content unless the user explicitly performs an editing operation.
- A crash or failed background task must not silently corrupt unrelated documents.

Add explicit validation and tests for these invariants.

## 3. Implement Reliable Persistence

Audit the existing persistence implementation before choosing a solution.

Use the smallest reliable approach that fits the current architecture.

### Autosave

Implement or verify:

- Debounced autosave to avoid excessive writes.
- A maximum acceptable delay before pending changes are persisted.
- Explicit tracking of the current editor revision.
- Explicit tracking of the last successfully persisted revision.
- Serialization of writes per document.
- Prevention of stale asynchronous writes overwriting newer content.
- Correct handling of errors and retries.
- A mechanism to flush pending saves during orderly shutdown.

Do not rely exclusively on a window-close event for durability. It cannot handle every crash, forced termination, or power failure.

Do not introduce arbitrary concurrent writes to the same document.

### Atomicity and durability

Where the current storage architecture uses files:

- Write new content to a temporary file in the appropriate destination.
- Validate the serialized content before committing it.
- Use atomic replacement where the operating system and filesystem support it.
- Handle failed writes and replacement operations without destroying the last valid copy.
- Clean up temporary files safely.
- Document platform-specific limitations.

Where the current architecture uses SQLite, use appropriate transactions, constraints, and durability settings.

Do not assume that atomic replacement alone prevents stale writes, storage-device failures, or every form of data loss.

### Save state

The interface must distinguish between:

- Changes not yet saved.
- A save in progress.
- Successfully saved content.
- A save failure requiring attention.

Do not show a successful saved state before the corresponding persistence operation has completed successfully.

If saving fails, preserve the in-memory manuscript and make recovery possible. Display a concise, actionable error without interrupting ordinary writing unnecessarily.

## 4. Implement Crash Recovery

Determine which recovery mechanisms are appropriate for the existing storage model.

Provide a recoverable draft, journal, checkpoint, or equivalent mechanism that is independent enough from the ordinary save path to recover recent work after abnormal termination.

Requirements:

- Recover pending changes where they were successfully persisted to the recovery mechanism.
- Detect incomplete or interrupted operations.
- Validate recovered content before restoring it.
- Never automatically overwrite a newer valid document with an older recovery snapshot.
- Detect when recovery content differs from the last normally saved version.
- Present recovery choices when ambiguity exists.
- Preserve the original file during recovery.
- Clean up obsolete recovery data only when it is safe to do so.
- Define a bounded retention policy to prevent unbounded storage growth.

Be precise about the guarantees provided. Do not claim that every keystroke is recoverable unless the implementation actually guarantees it under the relevant failure conditions.

## 5. Protect Undo, Redo, and Editing Correctness

Audit the editor's history and transaction behavior.

Test and fix issues involving:

- Rapid consecutive typing.
- Selection replacement.
- Multi-paragraph deletion.
- Bold, italic, underline, and heading changes.
- Paste and cut operations.
- Structural edits.
- Undo and redo across different operation types.
- Cursor and selection restoration.
- Composition-based text input.
- Editing while autosave is pending.
- Editing while background analysis is running.

Use the existing editor framework's transaction and history mechanisms where appropriate.

Do not implement a competing document history system without a demonstrated need.

Undo and redo must restore the intended content and preserve sensible selection behavior.

No background analysis or rendering task may silently rewrite the manuscript.

## 6. Handle Import, Serialization, and Corruption Safely

Treat every external document and persisted file as potentially malformed.

Implement or verify:

- Strict document schema validation.
- Graceful handling of truncated or malformed files.
- Safe parsing of unsupported constructs.
- Explicit error reporting.
- Preservation of the original source during import.
- Import previews when content requires conversion.
- Safe handling of unsupported document features.
- Validation after serialization and before persistence where appropriate.

Never respond to a parsing failure by silently creating an empty document and overwriting the original.

Do not silently discard unsupported content during import.

If the application cannot safely open a document, offer a recovery or diagnostic path that preserves the source.

## 7. Version the Document Schema Independently

The native manuscript format must have its own explicit schema version, independent of the Scribo application version and package versions.

Implement or verify:

- Schema version metadata.
- Explicit migration steps.
- Migration validation.
- Preservation of original documents before destructive migrations.
- Tests using representative older documents.
- Clear behavior for unsupported future schema versions.
- Recovery from interrupted migration attempts.

A document created with a newer version of Scribo must not be silently downgraded or overwritten by an older application.

Treat migrations as data-integrity operations, not ordinary application initialization.

## 8. Handle External File Changes and Filesystem Errors

Consider files modified, moved, deleted, or replaced outside Scribo.

Where relevant to the existing storage architecture:

- Detect external modifications.
- Avoid silently overwriting externally changed content.
- Present clear conflict-resolution choices.
- Handle unavailable destinations and permission failures.
- Handle disk-full errors.
- Handle interrupted writes.
- Handle files that become inaccessible while open.
- Prevent unsafe path handling and unintended file access.

Do not implement elaborate cloud synchronization at this stage.

Local-file reliability must be established before adding synchronization providers.

## 9. Prevent Performance Degradation

Profile the actual implementation before optimizing.

Pay particular attention to:

- Large manuscripts.
- Repeated full-document serialization.
- Full-document re-rendering on every keystroke.
- Expensive syntax or entity highlighting.
- Excessive React re-renders.
- Unbounded editor history.
- Unbounded recovery storage.
- Background tasks that block the UI thread.
- Repeated parsing and validation.
- Memory leaks during document switching.

Use incremental processing and editor decorations where appropriate.

Debounce or schedule nonessential analysis without compromising correctness.

Move CPU-intensive work off the UI thread when justified by profiling.

Do not introduce premature optimization that complicates document correctness.

Establish practical performance tests using representative manuscripts, including a large document with thousands of paragraphs.

## 10. Harden the Tauri and Rust Boundaries

Review all frontend-to-native operations.

Requirements:

- Use least-privilege Tauri capabilities.
- Restrict filesystem access to necessary operations and paths.
- Validate command arguments and file paths.
- Return structured, actionable errors from native commands.
- Avoid exposing generic unrestricted filesystem operations.
- Handle Rust errors explicitly rather than panicking on ordinary operational failures.
- Avoid unbounded blocking work on asynchronous execution paths.
- Ensure interrupted native operations leave documents recoverable.
- Do not expose sensitive manuscript contents in diagnostic logs by default.

Review relevant dependency advisories and existing security configuration.

Do not introduce a network service or authentication system.

## 11. Build Automated Failure-Injection Tests

Create deterministic tests for failure conditions rather than relying exclusively on successful-path unit tests.

At minimum, cover:

### Persistence

- Rapid edits producing overlapping autosave requests.
- An older save finishing after a newer save.
- A disk write failure.
- A failed atomic replacement.
- Interrupted persistence.
- Invalid serialized content.
- Reopening the latest successfully saved revision.

### Recovery

- Abnormal application termination.
- Recovery from an unsaved but recoverable draft.
- Recovery data older than the current document.
- Corrupted recovery data.
- Interrupted recovery operations.
- Safe cleanup of obsolete recovery files.

### Editing

- Mixed typing, formatting, paste, deletion, undo, and redo.
- Multi-paragraph selections.
- Unicode text.
- Indonesian punctuation and quotation marks.
- Composition-based input and IME behavior.
- Editing while a save or background task is pending.

### Schema and compatibility

- Valid documents from older schema versions.
- Invalid and truncated documents.
- Unsupported future schema versions.
- Migration failures.
- Preservation of content and metadata across migration.

### Performance

- Large-manuscript editing.
- Repeated document switching.
- Search and navigation on large documents.
- Highlighting and analysis while editing.

Use mocks or controlled filesystem adapters to simulate failures deterministically. Where useful, add integration tests that exercise the actual persistence implementation.

Never intentionally corrupt a user's real manuscript to test recovery. Use disposable fixtures and temporary directories.

## 12. Observability and Diagnostics

Introduce structured diagnostic information where appropriate.

Record:

- Operation type.
- Document identifier or a privacy-safe reference.
- Document revision.
- Save or recovery outcome.
- Error category.
- Relevant timing information.

Do not log manuscript text by default.

Provide enough diagnostic information to investigate failed saves and recovery problems without compromising user privacy.

Avoid introducing telemetry or analytics that transmits document contents or other sensitive information.

## 13. Implementation Order

Implement changes in this order:

**Phase 1 — Audit and critical defects**

Establish a baseline, identify actual risks, and fix any confirmed data-loss or corruption paths.

**Phase 2 — Persistence correctness**

Implement or verify revision-aware saves, stale-write prevention, error handling, and durable persistence.

**Phase 3 — Recovery**

Implement or strengthen recoverable drafts, startup recovery, and safe restoration.

**Phase 4 — Editing correctness**

Verify transactions, undo/redo, paste normalization, selections, and Unicode input.

**Phase 5 — Schema compatibility**

Implement versioned migrations and safe handling of invalid or unsupported documents.

**Phase 6 — Failure-injection tests**

Automate the critical failure scenarios and verify the resulting behavior.

**Phase 7 — Performance and security**

Profile large documents, resolve identified bottlenecks, and review Tauri permissions and native error handling.

Do not proceed to lower-priority optimization while a known critical data-loss defect remains unresolved.

## 14. Engineering Constraints

- Preserve the current monorepo architecture.
- Do not rewrite working functionality without justification.
- Do not add new frameworks unless required.
- Do not introduce Google Drive synchronization or cloud storage.
- Do not add AI-writing or linguistic-analysis features in this task.
- Do not replace the canonical document model merely to simplify persistence.
- Do not swallow errors.
- Do not silently discard valid user content.
- Do not claim a test passed unless it was actually executed.
- Do not claim a failure mode is handled unless the relevant behavior has been verified.
- Document any durability guarantees that cannot be provided by the chosen storage architecture.

Prefer small, reviewable changes with focused tests over a large, unverified refactor.

## 15. Definition of Done

This task is complete when:

1. The application's actual data-loss and corruption risks have been audited.
2. Critical persistence defects identified during the audit have been fixed.
3. Save operations cannot silently replace newer revisions with older ones.
4. Failed saves preserve the user's in-memory work and report the failure.
5. Crash recovery works for the failure conditions explicitly covered by the implementation.
6. Invalid documents and failed migrations do not destroy the original source.
7. Undo/redo and editing behavior are covered by meaningful tests.
8. Schema migration is versioned and tested.
9. Critical failure-injection tests pass.
10. Large-manuscript behavior has been measured.
11. Tauri filesystem permissions and native command boundaries have been reviewed.
12. Type checks, linting, tests, and relevant builds have been executed successfully, with any remaining failures documented.
13. The README or reliability documentation explains persistence behavior, recovery guarantees, known limitations, and diagnostic procedures.

## Final Principle

Scribo is a tool entrusted with irreplaceable creative work.

**Never silently lose a manuscript, never claim a failed save succeeded, never overwrite a newer revision with an older one, and never destroy the original when recovery or migration fails.**

Prioritize correctness and recoverability over convenience, speed of implementation, or feature count.
