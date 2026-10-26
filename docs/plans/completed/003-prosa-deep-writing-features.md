# Scribo: Writer-Centred Software

## Product Philosophy and Deep-Feature Plan

**Status:** **Completed (strategy archive)** — superseded for execution by [005-project-workspace-and-git.md](../active/005-project-workspace-and-git.md). Philosophy remains in [philosophy.md](../../product/philosophy.md). Feature delivery follows [project-architecture-roadmap.md](../active/project-architecture-roadmap.md).\
**Location:** `docs/plans/completed/`\
**Product:** Scribo Prosa, with principles intended to guide the wider
Scribo family\
**Purpose:** Define what Scribo should optimize for before committing to
the next wave of features.

---

## 1. Executive thesis

Most writing software is organized around the document editor: the page,
the formatting controls, the toolbar, the font menu, and the visible act
of changing a document's appearance.

Scribo should instead be organized around the writer's work.

A writer's primary job is not to operate an editor. It is to think,
research, compose, revise, organize, and finish a piece of writing. The
editor is only one instrument in that larger process.

Scribo's central proposition:

> **The document is the output. The writer's thinking and working
> process is the product.**

Scribo should therefore minimize the attention spent operating the
software and maximize the writer's ability to make meaningful progress.
It should provide powerful structure and analytical tools when needed,
but keep them quiet when they are not.

This is not a proposal to remove all formatting, complexity, or control.
It is a proposal to place those things in the right order:

1.  Protect and preserve the writer's work.
2.  Reduce friction between thought and expression.
3.  Make structure, meaning, and revision visible.
4.  Keep research and source material close to the writing.
5.  Support deliberate revision and long-term project development.
6.  Make presentation consistent and largely automatic.
7.  Expose advanced controls only when they solve a real writing
    problem.

The goal is not the smallest interface. The goal is the least
unnecessary cognitive overhead.

---

## 2. The problem with editor-centred software

Traditional editors often treat the document as a visual object that the
user must continually configure. This encourages interaction with the
tool rather than sustained attention to the work.

Common symptoms include:

- Repeated decisions about fonts, sizes, margins, spacing, colors, and
  layout while the writer is still composing.
- Toolbars and panels competing with the text for attention.
- Formatting used as a substitute for meaningful document structure.
- Research scattered across browser tabs, notes, PDFs, and unrelated
  applications.
- Revision represented as a sequence of opaque saves or destructive
  edits.
- Little visibility into how a manuscript changed, why it changed, or
  what needs attention.
- Weak support for relationships between people, places, claims,
  sources, scenes, concepts, and passages.
- Features designed around general document production rather than the
  specific lifecycle of writing.

Not every editor suffers from every problem, and formatting control is
valuable for some tasks. The issue is the default centre of gravity: the
software tends to privilege manipulating the document's appearance over
advancing the writer's work.

### The counter-position

Scribo should not ask, "What controls should an editor expose?"

It should ask:

- What is the writer trying to accomplish at this moment?
- What information would help them make the next decision?
- What can the software safely handle automatically?
- What should remain under explicit human control?
- What information should be preserved so that a writer can return to
  the work later?
- How can a writer move between drafting, research, analysis, and
  revision without losing context?

---

## 3. Product principles

### 3.1 Writer-first, not editor-first

Optimize for the full writing process: capture, research, outline,
draft, revise, verify, and deliver. Editing text is central, but it is
not the whole product.

**Implication:** Evaluate features by their contribution to writing
outcomes, not by how many controls or capabilities they add.

### 3.2 Content before presentation

The manuscript should contain meaningful structure rather than
incidental visual styling. Headings, paragraphs, quotations, dialogue,
scene breaks, lists, and other semantic units should be represented
explicitly where appropriate.

Presentation should be globally coherent and easy to change. Writers
should not have to format every paragraph manually to achieve a
consistent result.

**Implication:** Separate the canonical document model from editor
presentation and export rendering.

### 3.3 Quiet by default, powerful on demand

The default writing surface should be calm. Analysis, metadata,
navigation, and project tools should be available without permanently
occupying the writer's attention.

**Implication:** Prefer contextual panels, progressive disclosure,
keyboard access, and reversible modes over a permanently crowded
dashboard.

### 3.4 Preserve intent; never silently rewrite it

The software may detect patterns, propose corrections, identify
entities, and explain possible problems. It must distinguish between
what the writer authored and what the software inferred.

**Implication:** Automated analysis should create annotations,
suggestions, or explicitly accepted edits---not invisible manuscript
mutations.

### 3.5 Trust is a feature

A writing tool handles work that may represent months or years of
effort. Reliability, recoverability, provenance, and predictable file
behavior are core product features, not infrastructure chores.

**Implication:** Never silently lose text, report an unconfirmed save as
successful, or overwrite a newer revision with an older one.

### 3.6 The writer owns the work

Manuscripts should remain accessible, exportable, and understandable
outside Scribo. The application should avoid unnecessary lock-in and
preserve a clear path to recover data.

**Implication:** Use documented, versioned formats; provide reliable
export; keep local writing possible without a network connection.

### 3.7 Context should travel with the project

Research notes, source references, decisions, character details,
terminology, and revision history should be connected to the manuscript
rather than scattered across unrelated tools.

**Implication:** Build a project knowledge layer that can link to
passages and sources while keeping the manuscript itself portable.

### 3.8 Intelligence should be inspectable

When Scribo flags an issue or suggests a change, the writer should be
able to understand why. Confidence and uncertainty should be visible
where relevant.

**Implication:** Prefer explainable checks and deterministic tools
before opaque, broad AI interventions.

### 3.9 Optimize for continuity, not engagement

Scribo should help writers resume work, maintain momentum, and finish
projects---not maximize notifications, streaks, time spent in the app,
or other engagement metrics.

**Implication:** Track useful outcomes such as recovery success, reduced
friction, and completed writing tasks rather than time in product alone.

### 3.10 Complexity must earn its place

Every feature introduces interface, implementation, testing, and
maintenance costs. Advanced capabilities should be added only when they
solve a recurring, meaningful problem.

**Implication:** A feature is not justified merely because competing
software has it.

---

## 4. The writer's workbench: a model of the product

Scribo should be thought of as a **writer's workbench** with several
connected layers, not as a word processor with an expanding collection
of panels.

### Layer A --- Manuscript

The authoritative text and its semantic structure: paragraphs, headings,
dialogue, quotations, lists, scenes, and other supported units.

Primary question: **What am I writing?**

### Layer B --- Composition environment

The editing surface, keyboard behavior, focus mode, navigation,
typography, cursor behavior, and formatting commands.

Primary question: **How can I stay in the flow of writing?**

### Layer C --- Revision and history

Snapshots, diffs, named versions, checkpoints, annotations, comparison,
restoration, and the ability to understand how a draft evolved.

Primary question: **What changed, and which version should I keep?**

### Layer D --- Research and evidence

Source documents, web references, quotations, notes, citations, claims,
evidence, and links from source material to manuscript passages.

Primary question: **What do I know, and where did it come from?**

### Layer E --- Project knowledge

Entities, aliases, timelines, terminology, locations, character
information, recurring concepts, decisions, and project-specific facts.

Primary question: **What must remain consistent across this work?**

### Layer F --- Analysis and diagnostics

Search, linguistic annotations, repeated phrases, consistency checks,
structural analysis, dialogue analysis, terminology checks, and later
grammar/style assistance.

Primary question: **What should I inspect or improve?**

### Layer G --- Delivery

Export, rendering, format validation, citations, manuscript reports, and
target-specific output.

Primary question: **How do I deliver this work in the form it needs?**

These layers should be connected but not permanently visible at once.
The manuscript remains the primary surface; other layers appear when the
task calls for them.

---

## 5. The core feature strategy

Features are grouped by capability and dependency, not by an arbitrary
promise to ship a fixed number in each release.

## 5.1 Foundation: protect the work

This is the prerequisite for every other feature.

### Required capabilities

- Autosave with explicit revision tracking.
- Reliable save status based on confirmed persistence.
- Crash recovery and recoverable drafts.
- Atomic writes or transactional persistence where supported.
- Serialization of writes so older asynchronous saves cannot overwrite
  newer edits.
- Detection of external file changes and explicit conflict handling.
- Safe import, migration, and repair that preserve the original when
  something fails.
- Backups and bounded, inspectable recovery history.
- Document schema versioning independent of application versioning.
- Large-document performance and memory limits that are measured, not
  guessed.
- Privacy-preserving diagnostics that do not log manuscript contents
  by default.

### Acceptance standard

A user can force-quit, encounter a failed write, reopen after a crash,
or present a malformed file without Scribo silently losing content or
pretending that an unsuccessful operation succeeded.

Do not treat "autosave exists" as proof of safety. Test failure cases
deliberately.

## 5.2 Composition: reduce friction

The writing surface should make it easy to think in sentences and
paragraphs without requiring constant interface management.

### Capabilities

- Stable keyboard-first editing and navigation.
- Predictable selection, paste, undo/redo, IME, Unicode, and
  multi-line behavior.
- Focus mode and distraction controls that remove interface noise
  without hiding necessary context.
- Semantic formatting commands with consistent behavior across Classic
  and Markdown modes.
- Fast search and replace, including safe replacement previews for
  broad changes.
- Adjustable reading width and interface scale as optional
  accessibility and comfort settings---not as the product's central
  activity.
- A reliable outline and section navigation.
- Sentence, paragraph, and section context that follows the caret
  without excessive visual activity.
- Quick capture for thoughts that should be saved without disrupting
  the current passage.

### Design rule

The interface should optimize for sustained attention, not for a
screenshot of minimalism. Minimalism that hides essential actions or
makes state ambiguous is a failure.

## 5.3 Versioning: treat revision as a first-class activity

Version history is more than an undo stack. Undo handles recent editing
operations; revision history helps a writer understand a project's
evolution over time.

### Proposed capabilities

**Automatic checkpoints** - Create checkpoints at meaningful boundaries:
explicit saves, session boundaries, major edits, or configured
intervals. - Avoid creating a noisy version for every keystroke. -
Preserve a recoverable baseline before risky transformations.

**Named versions** - Allow labels such as "first complete draft,"
"editorial revision," or "submission copy." - Add optional notes
explaining the intent of a revision.

**Comparison** - Compare current text with a selected checkpoint. - Show
insertions, deletions, moved passages, and changed sections. - Compare
at paragraph or section level before exposing low-level text
differences. - Make it easy to inspect one change in context.

**Restoration** - Preview before restoring. - Restore into a new
revision or create a checkpoint of the current state first. - Never
silently destroy the current version.

**Branching, later** - Consider parallel drafts for genuinely different
editorial directions. - Avoid implementing full Git-like branching until
real workflows establish the need.

### Git integration: a considered option, not a prerequisite

Git is useful for technical writers and writers comfortable with commits
and diffs, but it should not be the default user-facing mental model for
every author.

A better sequence is: 1. Build native revision history and comparison
around writing concepts. 2. Establish a stable, portable project format. 3. Consider optional Git interoperability or export for users who want
it.

Scribo should borrow the useful properties of version control---history,
diff, restoration, provenance---without requiring every writer to
understand repositories, staging, branches, and merge conflicts.

### Acceptance standard

A writer can answer "what changed?", "when did this passage disappear?",
and "can I recover the earlier version?" without understanding Git.

## 5.4 Syntax and semantic highlighting: make structure visible

Highlighting should expose useful information, not turn prose into a
rainbow.

### Initial categories

- Formatting semantics: headings, quotations, dialogue, scene breaks,
  code, and other supported structures.
- Dialogue delimiters and possible attribution.
- Named entities and their canonical forms.
- Repeated phrases and suspicious repetitions.
- Project-specific terms, names, and spelling conventions.
- Source-linked claims and citation markers in relevant writing modes.

### Modes

- **Clean mode:** near-normal manuscript appearance; annotations
  remain quiet.
- **Analysis mode:** show selected annotation categories with
  restrained colors and clear legends.
- **Review mode:** focus on issues and proposed changes, with
  navigation between them.

### Architectural constraints

- Annotations are separate from the canonical manuscript.
- The writer can enable or disable annotation categories.
- Every inferred annotation has an explanation or inspectable basis.
- Uncertain classifications are suggestions, not facts.
- Annotations use stable editor-native ranges or anchors and are
  invalidated when their supporting text changes.
- Export excludes analysis styling unless the writer explicitly
  requests an analysis report.

### Acceptance standard

Highlighting improves recognition without reducing readability, changing
the text, or making every sentence visually noisy.

## 5.5 Research and source library: keep evidence close to the writing

For nonfiction, essays, memoir, journalism, academic writing, and
research-heavy fiction, source material is part of the writing process.

### Source types

- Web pages and URLs.
- PDFs and documents.
- Books and bibliographic records.
- Quotations and excerpts.
- Writer-created notes.
- Images or other reference material where useful.
- Interview notes and primary-source records.

### Source records should support

- Title, author/creator, publication date, URL or identifier, access
  date, and other relevant metadata.
- Excerpts and quotations with page or location information where
  available.
- Notes about relevance, reliability, and limitations.
- Links from a source or excerpt to one or more manuscript passages.
- Search across source titles, notes, and extracted text.
- Duplicate detection and source identity.
- Portable export and backup.

### Evidence workflow

1.  Capture a source.
2.  Record why it matters.
3.  Save a relevant excerpt or note.
4.  Link it to a claim, topic, scene, or passage.
5.  Revisit the source while revising.
6.  Generate citations or a source list when the writing mode requires
    them.

### Important distinction

A research library should not pretend that collected material is
automatically verified. Preserve provenance, distinguish a source's
content from the writer's interpretation, and expose missing metadata or
uncertain attribution.

### Privacy and implementation constraints

- Keep the core workflow local-first.
- Do not require an account or cloud service for basic writing.
- Treat web clipping, document parsing, and external integrations as
  optional capabilities.
- Clearly indicate when content is stored locally versus remotely.
- Do not silently fetch or upload manuscript content to third-party
  services.

## 5.6 Project knowledge: consistency across long works

Long manuscripts create continuity problems. A project knowledge layer
can help writers track facts without turning the editor into a rigid
database application.

### Potential records

- People and characters.
- Places and organizations.
- Objects and recurring motifs.
- Timeline events.
- Terminology and preferred spellings.
- Claims, themes, concepts, and decisions.
- Unresolved questions.
- Style and continuity rules.

### Core operations

- Create a canonical entity with a stable identifier.
- Record aliases and alternate spellings.
- Find occurrences in the manuscript.
- Detect possible inconsistencies.
- Link an entity to relevant notes, sources, and passages.
- Track confirmed facts separately from hypotheses and outdated ideas.

### Detection strategy

Begin with deterministic matching and user-maintained records. Exact
name matching and alias detection are tractable and explainable.
Pronouns, implicit references, and contextual relationships are harder;
show them as uncertain suggestions.

### Acceptance standard

A writer can find every known occurrence of a character, place, or
project term and review likely inconsistencies without having to trust
opaque automatic rewriting.

## 5.7 Analysis and revision intelligence

Build a progression from simple, verifiable checks to more interpretive
analysis.

### Stage 1 --- Deterministic diagnostics

- Repeated words and phrases.
- Overused terms.
- Name and spelling consistency.
- Missing or inconsistent headings.
- Structural anomalies.
- Unresolved placeholders.
- Citation and source-reference completeness.
- Basic dialogue and scene statistics where relevant.

### Stage 2 --- Linguistic analysis

- Sentence and paragraph segmentation.
- Part-of-speech annotations where the language supports reliable
  analysis.
- Dialogue attribution suggestions.
- Readability and sentence-length patterns.
- Possible ambiguity or repetitive sentence structure.

### Stage 3 --- Contextual assistance

- Style and tone observations.
- Continuity suggestions.
- Possible unsupported claims or missing evidence.
- Alternative phrasing when requested.
- Context-aware editorial questions.

### Rules for intelligent features

- Never silently replace text.
- Separate detection from recommendation and recommendation from
  application.
- Explain the evidence behind a flag.
- Allow the writer to dismiss, accept, or mark an issue as
  intentional.
- Preserve the original and provide a way to reverse accepted
  transformations.
- Evaluate performance and quality separately for each supported
  language.

For Indonesian, language-aware analysis must account for affixation,
reduplication, clitics, informal registers, borrowed words, and context.
Do not assume an English-oriented pipeline will transfer reliably.

AI should be an optional layer, not a dependency for basic writing, file
access, search, revision history, or research storage.

## 5.8 Delivery and publishing

Formatting is not irrelevant; it is simply not the primary activity
during composition.

### Capabilities

- Consistent global presentation presets.
- Export to formats appropriate to each Scribo product.
- Preview of the actual exported result.
- Validation of headings, quotations, citations, and other relevant
  structures.
- Clear separation between manuscript semantics and output-specific
  formatting.
- Reproducible export settings.
- Preservation of source text and project metadata across exports
  where possible.

A writer should be able to focus on the work and make a deliberate
delivery choice when needed, rather than continuously adjusting the
manuscript's visual appearance while composing.

---

## 6. A proposed interface model

Do not turn all these capabilities into permanently visible panels.
Organize the interface around the writer's current task.

### Primary surface

The manuscript occupies the main space. It should have the strongest
visual hierarchy and the fewest persistent distractions.

### Contextual workspace

A side panel or secondary view can display one active context at a time:

- Outline.
- Find and replace.
- Revision history and comparison.
- Research sources.
- Project knowledge.
- Analysis results.

These tools should share navigation and linking conventions rather than
each behaving like a separate application.

### Command access

Provide keyboard shortcuts and a searchable command interface for
frequent and advanced operations. Commands should have clear names,
predictable behavior, and visible results.

### Status and trust indicators

Save status, external-change warnings, recovery availability, and
conflict state must be clear without dominating the interface. Important
warnings should not be communicated by color alone.

### Focus transitions

A writer should be able to: - Draft without seeing research or
analysis. - Open a source without losing their position in the
manuscript. - Inspect a revision and return to the current draft. -
Review flagged issues one by one. - Resume the previous task without
reconstructing context manually.

---

## 7. Product architecture principles

The architecture should preserve future flexibility without prematurely
creating dozens of packages or abstractions.

### Canonical document model

Owns manuscript content and semantic structure. It must not depend on
React, Tauri, a specific editor widget, or a particular storage engine.

### Editor adapter

Translates between the canonical model and editing surfaces such as
Classic and Markdown. Each mode must have explicitly defined
synchronization and round-trip guarantees.

### Annotation engine

Produces analysis results independently from the document model.
Annotations reference text ranges or stable anchors and have provenance,
category, confidence where applicable, and invalidation rules.

### Project knowledge store

Stores entities, source records, links, and project metadata. It should
reference manuscript locations without embedding all of its logic into
the editor.

### Revision subsystem

Records checkpoints, revisions, diffs, and restoration operations. Its
data model should make revision identity and parentage explicit even if
full branching is deferred.

### Persistence boundary

Provides reliable local storage, migration, recovery, and
external-change handling. All save operations must be revision-aware and
tested against concurrency and failure.

### Export/rendering subsystem

Converts semantic content into target-specific output without modifying
the canonical manuscript as a side effect.

### Integration boundary

External services such as Google Drive should be adapters around the
core project and persistence model. A network integration must not be a
requirement for editing local manuscripts.

### Architectural caution

Do not split every concept into its own package immediately. Extract a
package when it establishes a real boundary, supports reuse, or makes
testing and ownership clearer. Abstraction without a concrete use case
adds maintenance cost.

---

## 8. Data and portability strategy

Scribo should treat the user's project data as a durable asset.

### Separate the version domains

- **Application version:** the version of the installed software.
- **Document schema version:** the version of the manuscript
  representation.
- **Project metadata version:** the version of research, entities, and
  other project-level records.
- **Revision identity:** the identity and ancestry of a saved state.

These versions must not be conflated.

### Define recovery guarantees

Document what happens when: - A save is interrupted. - A process
terminates unexpectedly. - A disk becomes full. - Permissions change. -
A document is malformed. - A schema migration fails. - An external
application changes the file. - Two devices edit divergent copies. - A
synced directory contains a partially synchronized project.

### Prefer explicit portability

- Preserve raw Markdown where it is the chosen source format.
- Document any Scribo-specific extensions.
- Provide predictable exports.
- Avoid opaque storage without a recovery or export path.
- Keep backups and recovery data discoverable and bounded.
- Make destructive operations explicit and reversible where feasible.

A single Markdown file is convenient for portability, but research
records, revision history, and project metadata may eventually require a
richer project format. Choose the format deliberately; do not assume
that a collection of independently synchronized files is always safe.

---

## 9. Prioritization framework

Score proposed features against the following questions:

1.  **Writer value:** Does this help the writer produce, understand,
    revise, or deliver better work?
2.  **Frequency:** Is the problem recurring or consequential?
3.  **Trust impact:** Does it protect work or reduce the risk of loss?
4.  **Cognitive cost:** Does it reduce friction, or add another thing to
    manage?
5.  **Explainability:** Can the writer understand what the feature did
    and why?
6.  **Reversibility:** Can mistakes be undone safely?
7.  **Architectural leverage:** Does it create a reusable capability for
    future features?
8.  **Maintenance cost:** Can it be implemented and tested reliably?
9.  **Language and genre coverage:** Does it work for the intended
    language and writing mode, or is its scope explicit?
10. **Evidence:** Has the need been observed in actual writing, rather
    than inferred from competitor feature lists?

### Suggested decision rule

A feature should not be prioritized solely because it is impressive,
novel, or common in competing products. High-risk persistence
improvements can take precedence even when they are invisible. Broad
intelligence features should wait until their accuracy and failure modes
are understood.

---

## 10. Suggested roadmap

This is a dependency-oriented roadmap, not a fixed release calendar.
Work can overlap when dependencies are satisfied.

### Phase 0 --- Validate the philosophy through real use

- Use Scribo Prosa for real writing sessions and at least one
  sustained project.
- Keep a record of friction points, interruptions, repeated manual
  tasks, and moments of lost context.
- Distinguish problems in the writing process from problems in the
  current implementation.
- Test Classic and Markdown mode against real documents.
- Establish a small set of representative manuscripts: short prose,
  long prose, dialogue-heavy text, research-heavy text, and documents
  with complex Markdown structures.

**Exit condition:** A prioritized problem list grounded in actual
writing, not a speculative feature inventory.

### Phase 1 --- Reliability and document invariants

- Audit persistence, autosave, recovery, schema migrations, and
  external changes.
- Test overlapping saves and stale asynchronous operations.
- Test crashes, failed writes, malformed documents, and recovery.
- Establish invariants for canonical content and Classic/Markdown
  conversion.
- Measure large-document responsiveness.

**Exit condition:** Failure scenarios have deterministic expected
behavior and automated regression tests.

### Phase 2 --- Revision history

- Design a revision data model.
- Implement automatic checkpoints and named versions.
- Build readable paragraph- and section-level comparison.
- Implement preview-first restoration and recovery of the
  pre-restoration state.
- Add revision navigation to the contextual workspace.

**Exit condition:** A writer can inspect and restore earlier work
without risking the current draft.

### Phase 3 --- Annotation and structural analysis

- Define annotation categories, anchors, provenance, and invalidation.
- Implement clean, analysis, and review modes.
- Add deterministic diagnostics: repeated phrases, placeholders,
  structure, and terminology.
- Add entity records and exact/alias matching.
- Build tests proving that annotations never mutate manuscript
  content.

**Exit condition:** Analysis is useful, explainable, and separate from
the source of truth.

### Phase 4 --- Research library

- Define source, excerpt, note, and citation data models.
- Add capture and metadata editing.
- Link sources to passages and project topics.
- Implement search and duplicate handling.
- Provide backup and portable export.
- Establish clear local/cloud storage boundaries.

**Exit condition:** A writer can collect evidence, retrieve it later,
and trace a manuscript passage to its supporting material.

### Phase 5 --- Project knowledge and continuity

- Extend entities with aliases, attributes, timelines, and links.
- Add occurrence lists and reviewable consistency checks.
- Support unresolved questions and deliberate exceptions.
- Improve contextual suggestions only when confidence and
  explainability are adequate.

**Exit condition:** Writers can inspect and maintain continuity without
having to accept automatic guesses as truth.

### Phase 6 --- Language-aware revision assistance

- Start with one clearly defined language and scope.
- Evaluate tokenization, segmentation, morphology, and contextual
  limits.
- Add opt-in diagnostics and reviewable suggestions.
- Maintain a representative test corpus and track false positives.
- Expand only when quality is demonstrated.

**Exit condition:** The feature's supported language, limitations, and
error profile are explicit.

### Phase 7 --- Integrations and broader platforms

- Add external storage adapters where they solve validated problems.
- Design safe conflict handling before seamless synchronization.
- Consider web and mobile surfaces only after the shared document and
  project models are stable.
- Preserve local-first functionality and portable exports.

**Exit condition:** Integrations extend the workbench without making the
core product dependent on a network or vendor.

---

## 11. What Scribo should deliberately avoid

- Turning the writing surface into a permanent dashboard of metrics
  and panels.
- Making typography and layout customization the centre of the
  product.
- Adding features only to match competitor checklists.
- Treating every inferred entity, grammatical label, or continuity
  observation as certainly correct.
- Silently rewriting text during analysis, normalization, or
  synchronization.
- Building full Git semantics before proving that writers need them.
- Requiring AI, an account, or a cloud connection for basic editing.
- Implementing collaboration before single-user data integrity and
  conflict behavior are sound.
- Creating an abstraction or package for every possible future
  capability.
- Measuring success by time spent in the application.
- Confusing a minimal interface with a minimal feature set.
- Confusing more features with greater utility.

---

## 12. How to know whether Scribo is working

The most useful metrics are those that measure whether the product
supports the writing process.

### Trust metrics

- Rate of unrecoverable content loss: target zero.
- Save-status correctness under injected failures.
- Recovery success rate.
- Number of silent conflict resolutions: target zero.
- Successful migration and export rates.

### Flow metrics

- Time and interaction count to resume a project.
- Frequency of unnecessary mode or panel changes.
- Search and navigation success.
- Time required to locate a prior passage or revision.
- Writer-reported interruptions caused by the interface.

### Revision metrics

- Time to compare meaningful revisions.
- Success rate for finding and restoring prior passages.
- Rate of accepted suggestions later reversed or dismissed.
- False-positive rates for diagnostics.

### Research metrics

- Time to retrieve a source or note.
- Proportion of important claims with traceable sources in relevant
  workflows.
- Ability to identify the origin of a quotation or excerpt.
- Successful backup and export of project knowledge.

Metrics should inform product decisions, not become a reason to
instrument every aspect of a writer's behavior. Collect the minimum data
necessary; local and privacy-preserving measurements should be
preferred.

---

## 13. Immediate next steps

Before beginning a broad feature sprint:

1.  **Write the product invariants.** Define what must always remain
    true about manuscript integrity, semantic structure, reversibility,
    and portability.
2.  **Create a real-use research log.** Record concrete friction from
    writing sessions, with enough context to reproduce it.
3.  **Audit the existing architecture.** Map the current document model,
    Classic/Markdown synchronization, persistence boundary, recovery
    behavior, and editor annotations.
4.  **Design revision history before research storage.** Revision
    history is a broadly useful capability and will expose important
    questions about project identity, persistence, and diff semantics.
5.  **Define the annotation contract.** Establish that analysis is
    separate from content before adding more highlighting and linguistic
    features.
6.  **Design source and project knowledge models.** Keep research
    records linked to, but distinct from, manuscript text.
7.  **Build one capability end-to-end.** Prefer a complete, tested
    revision-history workflow over several disconnected feature
    prototypes.

### First concrete design deliverable

Produce a short technical specification for **Revision History v1**
covering:

- Revision and checkpoint identity.
- When automatic checkpoints are created.
- Storage and retention.
- Diff granularity.
- Restoration semantics.
- Interaction with autosave and crash recovery.
- External-file changes and conflicts.
- Performance for large manuscripts.
- Failure cases and tests.
- Export, backup, and future portability.

Do not start with branching. First prove that a writer can trust
history, understand differences, and restore work safely.

---

## 14. Final statement of philosophy

Scribo is not merely a place to type words. It is a durable,
writer-controlled environment for developing ideas into finished work.

Its editor should be calm because the writer's attention is valuable.
Its analysis should be powerful because writing is complex. Its history
should be trustworthy because revision is irreversible without it. Its
research tools should preserve provenance because memory is fallible.
Its architecture should be open enough that the writer's work remains
theirs.

The governing principle is:

> **Scribo should take responsibility for the machinery of writing so
> that the writer can take responsibility for the writing itself.**

Every proposed feature should be tested against that principle. If it
adds machinery without improving the writer's work, it does not belong
in the product.
