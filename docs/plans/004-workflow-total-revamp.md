# Scribo Engineering Operating Model

## Repository-First Knowledge, GitHub Coordination, and Historical Baseline

**Status:** Proposed operating policy\
**Applies to:** Scribo monorepo, Scribo Prosa, shared packages, AI
coding agents, and future contributors\
**Decision:** Repository-first, GitHub-enabled, with an explicit
baseline for work completed before this policy.

---

## 1. Purpose

Scribo needs an engineering workflow that is auditable, AI-native, and
ready for future open-source collaboration without creating unnecessary
administration for a solo developer.

The operating model must answer four questions:

1.  Where is the canonical knowledge about how Scribo should work?
2.  Where are active tasks, proposals, and discussions managed?
3.  How are implementation and correctness evidenced?
4.  How do we record the project's existing state without retroactively
    manufacturing issues, pull requests, or decision records for
    everything already done?

The model is **repository-first, not repository-only**.

- The repository is the canonical home for durable product and
  engineering knowledge.
- GitHub Issues and Projects coordinate active work when useful.
- Pull requests record implementation review and validation when used.
- Git history records code and documentation changes.
- Tests and CI provide repeatable evidence of behavior.
- A one-time baseline records what was already true before the
  workflow was adopted.

These systems link to each other, but do not mirror every interaction.

---

## 2. Core policy

### 2.1 Repository is the source of truth for durable knowledge

Keep versioned documents in the repository for:

- Product philosophy and principles.
- Roadmap and accepted product direction.
- Architecture and consequential decisions.
- Feature specifications and behavioral contracts.
- Engineering workflow and coding-agent instructions.
- Testing strategy and quality requirements.
- Data-format, migration, persistence, security, and privacy
  guarantees.
- Release procedures and compatibility policy.
- Runbooks for significant failures or recovery.

A decision is not considered durably documented merely because it
appeared in a chat, issue comment, or PR discussion. When a decision has
lasting significance, promote the conclusion---not the entire
discussion---into the relevant repository document.

### 2.2 GitHub is the coordination layer

Use GitHub-native features for the work they are designed to manage:

- Issues: bugs, feature proposals, engineering tasks, research, and
  epics.
- Projects: active status, prioritization, and cross-issue planning
  when useful.
- Issue comments: task-specific clarification and discussion.
- Pull requests: change rationale, review, validation, and merge
  discussion.
- Actions: automated checks and release workflows.
- Releases: published artifacts and user-facing release notes.
- Security Advisories or private reporting: vulnerability
  coordination.

Do not copy every issue, comment, board update, PR comment, or CI result
into Markdown. Keep the original record in GitHub. Promote only lasting
requirements, decisions, invariants, and lessons.

### 2.3 Git is the implementation history

Use commits, branches, tags, and diffs to understand what changed and
when. Keep commits meaningful enough to inspect. Use pull requests for
substantial changes when practical, but do not make PR ceremony
mandatory for every small solo edit.

### 2.4 Tests and CI are correctness evidence

Documentation describes intended behavior; source code implements it;
tests check important behavior. When these disagree, investigate and
resolve the discrepancy explicitly. Do not assume that either
documentation or code is automatically correct.

### 2.5 No retroactive paperwork

Do not create artificial issues, PRs, ADRs, or detailed task histories
for every feature already implemented before adopting this workflow.
Establish a clearly dated baseline of the current project and start
using the full workflow prospectively.

Only reconstruct historical details when they are known, useful, and
supported by evidence. Label uncertainty honestly.

---

## 3. Source-of-truth matrix

---

Information Canonical location Required
synchronization

---

Product philosophy `docs/product/philosophy.md` Update when principles
change

Product roadmap `docs/product/roadmap.md` Update when priorities
or outcomes change

Current architecture `docs/architecture/system-overview.md` Update when
overview architecture materially
changes

Consequential technical `docs/architecture/decisions/` Add or supersede ADRs
rationale for major decisions

Detailed feature `docs/specs/` Update alongside
contract relevant behavior
changes

Engineering and agent `AGENTS.md`, `CONTRIBUTING.md` Keep commands and
rules policies accurate

Bug/feature status GitHub Issues, if enabled Do not mirror every
status into Markdown

Task discussion GitHub Issue/PR thread Promote lasting
conclusions only

Code changes Git history Commit and tag
meaningful states

Correctness evidence Tests and CI Keep tests close to
implementation

Release history Git tags, release notes, Changesets Record what was
released and validate
artifacts

Historical state at `docs/engineering/project-baseline.md` Update only if
workflow adoption explicitly maintained
as a living baseline

Current active A focused spec/plan or linked GitHub Avoid duplicate task
implementation plan issue trackers
----------------------------------------------------------------------------------------

If GitHub is temporarily unavailable, development can continue locally.
Record durable decisions in repository files and synchronize
coordination records later if needed. Do not let an external task
tracker become the only place where a critical data contract or
architectural invariant exists.

---

## 4. Repository structure

Adapt this structure to the current monorepo rather than moving existing
code merely to match the example.

```text
.
├── AGENTS.md
├── CONTRIBUTING.md
├── README.md
├── LICENSE
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── SUPPORT.md
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── CODEOWNERS
│   └── workflows/
├── docs/
│   ├── plans/
│   │   ├── README.md
│   │   ├── active/
│   │   └── completed/
│   ├── product/
│   │   ├── philosophy.md
│   │   └── roadmap.md
│   ├── engineering/
│   │   ├── operating-model.md
│   │   ├── project-baseline.md
│   │   ├── testing-strategy.md
│   │   ├── release-process.md
│   │   └── compatibility.md
│   ├── architecture/
│   │   ├── system-overview.md
│   │   ├── data-model.md
│   │   └── decisions/
│   ├── specs/
│   └── runbooks/
├── apps/
├── packages/
└── .changeset/
```

Do not create every directory immediately if it would be empty.
Establish the structure as relevant work appears.

### Canonical document rules

- Each durable topic has one canonical document.
- Other documents link to it instead of copying the full content.
- Specs describe intended contracts, not a transcript of
  implementation.
- ADRs preserve why a consequential choice was made.
- Roadmaps express direction and priority, not guaranteed delivery
  dates.
- Implementation plans live in `docs/plans/active/` while work is
  being planned or implemented, then move to `docs/plans/completed/`
  when finished if they remain useful as a record.
- Temporary plans are not permanent documentation by default; retain
  completed plans only when they provide useful implementation context.
- Public docs must not contain private manuscripts, credentials,
  tokens, or sensitive user data.

---

## 5. One-time opening balance: establish the baseline

The project has already reached multiple releases and has an existing
architecture, codebase, product philosophy, and engineering history. The
workflow must recognize that reality without demanding retroactive
reconstruction of every past task.

Create `docs/engineering/project-baseline.md` as the **opening balance**
for the new operating model.

It is a snapshot of what is known at the time the workflow is adopted.
It is not an attempt to recreate a perfect historical ledger.

### 5.1 What the baseline should contain

1.  **Baseline date and commit**
    - Date the workflow is adopted.
    - Git commit hash at the baseline, if available.
    - Application version and package versions at that point.
    - Working-tree status if the baseline is recorded while the tree
      has uncommitted changes.
2.  **Current product state**
    - What Scribo Prosa does today.
    - Current supported editing modes and major workflows.
    - Known limitations, without implying that unverified capabilities
      are complete.
3.  **Current architecture**
    - Monorepo and workspace layout.
    - Desktop stack and major packages.
    - Canonical document model and editor modes.
    - Persistence, recovery, and export boundaries as currently
      implemented.
    - CI, test, and release tooling that currently exists.
4.  **Known implemented capabilities**
    - Summarize major features already present.
    - Link to code, package manifests, release notes, tests, and
      existing documentation where possible.
    - Avoid claiming tests pass unless the relevant checks were
      actually run.
5.  **Known technical constraints and risks**
    - Known reliability, performance, compatibility, and privacy
      concerns.
    - Areas not yet audited.
    - Important behavior that is believed to exist but has not been
      verified.
6.  **Existing product decisions**
    - Record already-established principles and architectural choices
      when they can be supported by existing code, docs, or explicit
      recollection.
    - Mark their evidence and confidence.
    - Create an ADR for an old decision only when its rationale is
      known and still useful. Do not invent a historical rationale.
7.  **Open work at adoption**
    - Summarize the important work that remains.
    - Link to the current roadmap.
    - Create new GitHub issues only for active or accepted tasks that
      benefit from tracking; do not recreate every historical feature
      as a closed issue.
8.  **Verification status**
    - Checks run for the baseline.
    - Commands and results.
    - Known test gaps and platform gaps.
    - Explicit "not verified" entries.
9.  **Adoption boundary**
    - State that the new workflow applies prospectively from the
      baseline date.
    - Historical commits and releases remain the historical record.
    - No retroactive issues or PRs will be manufactured solely to make
      the history look complete.

### 5.2 Evidence labels

Use explicit labels where appropriate:

- **Verified:** inspected directly or validated by a recorded
  command/test.
- **Documented:** stated in existing documentation or release notes,
  not independently revalidated.
- **Reported:** known from maintainer recollection or a report, but
  not yet independently verified.
- **Unknown / not audited:** insufficient evidence.

The baseline should make uncertainty visible rather than hide it.

### 5.3 What not to do

- Do not create fake PRs or issues for work that happened before the
  process existed.
- Do not infer the original reasoning behind a design choice from the
  code alone.
- Do not mark existing functionality as fully tested merely because it
  has shipped.
- Do not rewrite Git history to fit the new process.
- Do not delay useful work until every historical detail is
  reconstructed.
- Do not treat the baseline as a guarantee that the current
  implementation is correct.

### 5.4 Baseline update policy

The baseline is primarily a one-time record. Do not turn it into a
second live roadmap or continuously rewrite it to reflect every change.

If a substantial audit discovers a material discrepancy, append a dated
correction or update a clearly marked "Audit findings" section while
preserving the original baseline statement. Ongoing truth belongs in the
normal canonical docs, tests, and Git history.

---

## 6. Work lifecycle from now on

Use this lifecycle for meaningful new work:

1.  **Capture:** Record a problem or opportunity. For solo work, this
    can start as a note or a GitHub Issue.
2.  **Triage:** Decide whether it is worth doing, and establish scope
    and priority.
3.  **Specify:** Write acceptance criteria. For cross-cutting or risky
    work, create a focused spec.
4.  **Plan:** Inspect the existing code and tests, then identify
    implementation steps and failure modes.
5.  **Implement:** Use a focused branch and small coherent commits.
6.  **Validate:** Run checks appropriate to the change and record what
    was actually run.
7.  **Review:** Inspect the diff, test coverage, documentation,
    security/privacy impact, and unintended changes.
8.  **Integrate:** Merge the change when the required checks and review
    are complete.
9.  **Release:** Use Changesets for affected published packages, and the
    documented release process for app artifacts.
10. **Close the loop:** Update the issue status if one exists, document
    durable decisions, and create follow-up work where needed.

For a trivial change, several steps may be implicit. For a data
migration or persistence change, they should be explicit and rigorous.

### How to start and save an implementation plan

A plan is a reviewable proposal, not permission to begin implementation.
For any nontrivial feature, create a Markdown plan in the repository so
it can be reviewed, versioned, and revised alongside the code.

Use this path convention:

- Active or awaiting approval: `docs/plans/active/<feature-name>.md`
- Completed, if worth retaining: `docs/plans/completed/<feature-name>.md`

Create `docs/plans/README.md` to explain the convention when the first
plan is added. Do not create empty directories just to satisfy this
example.

#### Planning procedure

1. **Name the intended outcome.** Describe the user problem and what
   should become possible or better.
2. **Read the repository guidance.** Start with `AGENTS.md`, this
   operating model, product philosophy, and relevant specifications,
   architecture docs, and ADRs.
3. **Inspect before proposing.** Examine the current implementation,
   document model, persistence, autosave, recovery, and relevant tests.
   Do not assume the feature is absent or that the code matches the docs.
4. **Write the plan.** Include current behavior and constraints,
   proposed scope, architecture/data implications, implementation
   phases and dependencies, failure modes, tests and acceptance criteria,
   documentation/migration needs, and unresolved questions.
5. **Separate evidence from assumptions.** Mark facts as verified only
   when inspected or tested. Explicitly label assumptions, unknowns, and
   decisions requiring approval.
6. **Save the plan.** Write it to
   `docs/plans/active/<feature-name>.md`. Treat the file in the working
   tree as the draft; commit it when you want the plan preserved in Git
   history or shared with collaborators.
7. **Review before coding.** Read the plan yourself, resolve important
   questions, and explicitly approve implementation. The agent must not
   silently continue from planning into coding.
8. **Implement against the approved plan.** Update the plan if material
   discoveries change the approach. Record significant changes and
   obtain approval again when scope, data integrity, or architecture
   changes materially.
9. **Close the plan.** When work is complete, update its status and move
   it to `docs/plans/completed/` if it remains useful. Promote lasting
   contracts to a spec, consequential choices to an ADR, and general
   engineering rules to canonical docs; do not use a completed plan as a
   substitute for those records.

#### Minimum plan structure

Each plan should contain:

- Status: Draft, Awaiting Approval, Approved, In Progress, Blocked, or
  Complete.
- Problem and intended user outcome.
- Current implementation and constraints.
- Proposed behavior, goals, and explicit non-goals.
- Architecture and data-model implications.
- Implementation phases and dependencies.
- Failure modes, data-integrity risks, and recovery behavior.
- Tests and acceptance criteria.
- Documentation, compatibility, and migration requirements.
- Open questions, alternatives, and decisions requiring approval.

Scale the detail to the risk. A small UI adjustment does not need a
long architecture document. Persistence, data-model, migration, recovery,
and security changes require explicit risk and validation plans.

#### Reusable planning prompt

Use this prompt with an AI coding agent when starting a nontrivial
feature. Replace the example feature name and adapt the requested
sections as appropriate.

```text
I want to plan [FEATURE NAME] for Scribo Prosa.

First, read AGENTS.md, docs/engineering/operating-model.md, the product
philosophy, and relevant architecture documentation, specifications,
and ADRs.

Inspect the existing codebase and relevant implementation and tests.
For persistence-related work, inspect the document model, persistence,
autosave, and recovery paths. Do not modify application code yet.

Produce an implementation plan that includes:
1. The problem and intended user outcome.
2. Current implementation and constraints.
3. Proposed behavior, scope, and explicit non-goals.
4. Architectural decisions and data-model implications.
5. Implementation phases and dependencies.
6. Failure modes, data-integrity risks, and recovery behavior.
7. Testing and acceptance criteria.
8. Documentation, compatibility, and migration requirements.
9. Open questions, alternatives, and decisions needing approval.

Distinguish verified facts from assumptions and unknowns. Identify
whether a formal specification or ADR is warranted.

Save the plan to
docs/plans/active/[feature-name].md.
Do not begin implementation until I explicitly approve the plan.
If the relevant docs or paths do not exist, report that fact and
propose the smallest appropriate setup rather than pretending they do.
```

#### Commit the plan

Once the plan is ready to preserve, inspect the changes and commit only
the intended planning files:

```bash
git status
git diff -- docs/plans/
git add docs/plans/active/<feature-name>.md
git commit -m "docs: plan <feature-name>"
```

If you are also introducing `docs/plans/README.md`, add that file
explicitly. Do not stage unrelated work with `git add .` unless you have
reviewed and intentionally want to include every changed file. A plan
commit records the proposal; it does not mean the plan has been approved
or implemented.

---

## 7. GitHub usage policy

GitHub features are available tools, not mandatory bureaucracy.

### Issues

Use issues for: - Bugs requiring reproduction, triage, or follow-up. -
Features with meaningful scope. - Engineering work that needs
prioritization or dependencies. - Research questions that need a bounded
investigation. - Larger initiatives spanning multiple changes.

A tiny typo or an isolated internal cleanup does not necessarily need an
issue.

### Projects

Use one lightweight project board if it improves visibility. A small
workflow can use `Inbox`, `Ready`, `In progress`, `Blocked`, and `Done`.
Do not maintain a duplicate status board in Markdown.

### Pull requests

Use PRs for substantial changes, cross-cutting features, risky
persistence changes, public API changes, and external contributions.
Solo development can still use PRs for reviewability, but not every tiny
change needs a PR if that slows work without adding value.

### Discussions and comments

Keep task-specific conversation in its issue or PR. When a conversation
reaches a durable conclusion: - Update the relevant spec or ADR. - Link
that document in the issue/PR. - Leave the discussion history where it
occurred.

Do not mirror all comments into the repository.

### Automation

Use CI, Changeset validation, dependency scanning, and release
automation where useful. Keep release publication, destructive
migrations, secret changes, and privacy-sensitive actions behind
explicit authorization.

---

## 8. Specs and architecture decisions

### When a spec is needed

Create a spec before implementation when work: - Changes the canonical
document model or persistence. - Adds revision history, research
storage, project knowledge, or a new analysis subsystem. - Changes file
formats, migration behavior, or export guarantees. - Adds
synchronization, collaboration, or an external service. - Has
significant privacy, security, or data-loss implications. - Crosses
multiple packages or changes a public API.

Small, isolated bug fixes can use a clear issue and PR description
instead.

### Spec template

A spec should normally cover: - Status and scope. - Problem and user
impact. - Goals and non-goals. - Current behavior and evidence. -
Proposed behavior. - Data/API implications. - Failure modes and
recovery. - Privacy/security considerations. - Compatibility and
migration. - Acceptance criteria and test plan. - Alternatives and open
questions. - Links to relevant issues, ADRs, and implementation PRs.

### ADR policy

Use an ADR for a consequential decision that future maintainers would
otherwise struggle to reconstruct. Include context, decision,
alternatives, consequences, status, and date.

When a decision changes, mark the previous ADR as superseded and link
the replacement. Do not rewrite history to make the new choice look like
the original one.

---

## 9. AI-native workflow

AI agents follow the same engineering standards as human contributors.

### Repository instructions

`AGENTS.md` should explain: - Product principles and non-negotiable
invariants. - Repository and package layout. - Canonical development
commands. - Testing and validation requirements. - Document model and
schema versioning rules. - Persistence, recovery, and data-loss
safeguards. - Documentation and Changeset expectations. - Security and
privacy boundaries. - How to report incomplete work and uncertainty. -
Actions requiring human approval.

Keep it operational. Link to detailed specs and policies instead of
embedding the whole engineering manual in the agent instructions.

### Standard agent sequence

1.  Read `AGENTS.md` and relevant canonical docs.
2.  Inspect the actual implementation and tests.
3.  Confirm the problem and summarize the current behavior.
4.  Identify affected boundaries, risks, and acceptance criteria.
5.  Propose a plan for nontrivial changes.
6.  Implement the smallest coherent change.
7.  Add or update regression tests.
8.  Run the required checks.
9.  Review the full diff for unrelated changes, secrets, and unsafe
    behavior.
10. Update canonical docs when contracts or decisions change.
11. Add a Changeset when a publishable package's public behavior
    requires it.
12. Report files changed, decisions made, checks actually run, failures,
    and remaining uncertainty.

### Agent truthfulness and authority

Agents must distinguish "ran and passed" from "not run," and "verified"
from "assumed." They must not claim success without evidence.

Require human approval before: - Publishing a release or package. -
Performing destructive migrations or deleting user data. - Rewriting
shared Git history. - Changing release credentials, signing keys, or
permissions. - Sending private manuscripts to external services. -
Enabling cloud, telemetry, or AI data transfer that changes privacy
behavior. - Merging or deploying when the environment permits those
actions.

AI-generated code does not receive weaker review standards.

---

## 10. Tests, CI, and definition of done

### Baseline CI checks

Configure canonical scripts for: - Formatting check. - Lint. -
Type-check. - Unit tests. - Package build. - Relevant integration
tests. - Tauri compile/build checks where practical. - Changeset
validation for relevant package changes. - Appropriate dependency and
secret scanning.

Document exact commands in `CONTRIBUTING.md` and `AGENTS.md`.

### Risk-based test requirements

**Document model / serialization** - Round-trip tests. - Legacy fixtures
and migration tests. - Malformed input. - Preservation of semantic
structure.

**Persistence / autosave** - Overlapping saves and stale writes. -
Failed writes and disk/permission errors. - Recovery after
interruption. - External modifications and conflict handling. - No
false-success save status.

**Editor** - Undo/redo, selection, paste, Unicode, IME, and large
documents. - Classic/Markdown round trips and keyboard behavior.

**Analysis** - Annotation invalidation after edits. - Deterministic
fixtures. - Evidence that analysis does not mutate canonical content.

### Definition of done

A task is complete when: - Acceptance criteria are satisfied. - Relevant
tests pass or unrun checks are explicitly identified. - The full diff is
reviewed. - No known critical regression remains. - Canonical
documentation is updated if a contract or decision changed. - Changesets
and migration notes are included when required. - The change is
committed and integrated through the chosen workflow. - Follow-up work
is recorded rather than left implicit.

---

## 11. Versioning and releases

Keep version domains separate:

- Application version.
- Published package versions.
- Manuscript schema version.
- Project metadata schema version.
- Revision identity.

Use Changesets for published workspace packages. Do not bump a package
solely because an internal file changed; evaluate public behavior and
API impact.

Release process: 1. Validate the intended release commit. 2. Review
Changesets and generated changelogs. 3. Run relevant full validation. 4.
Build target artifacts. 5. Sign/notarize where required. 6. Publish only
through an explicit release process. 7. Attach release notes and
artifacts to the release. 8. Test installation, upgrade, and opening
existing documents. 9. Record incidents and follow-up work.

A binary rollback may not undo a data migration. Every migration must
define compatibility, backup, and recovery behavior.

---

## 12. Public-readiness policy

Before inviting public contributions, establish: - A deliberate
`LICENSE` and clear rights to included assets. - A useful README and
reproducible setup instructions. - `CONTRIBUTING.md`,
`CODE_OF_CONDUCT.md`, `SECURITY.md`, and `SUPPORT.md`. - Issue and PR
templates. - CI and required checks. - Public API and compatibility
expectations. - A private security-reporting route. - Dependency and
secret scanning. - Clear instructions for running tests and building the
app. - Privacy-safe fixtures rather than real manuscript content. - A
maintainer policy for review, release, and contribution acceptance.

Public readiness does not require a large process. It requires that
someone unfamiliar with the project can understand it, build it, test
it, and make a safe change.

---

## 13. Adoption plan

Adopt the workflow prospectively, in stages.

### Stage 1 --- Establish the baseline

- Record the current commit, app/package versions, and known product
  state.
- Inspect the repository and summarize the existing architecture and
  capabilities.
- Record what is verified, merely documented, reported, or unknown.
- List major risks and unverified areas.
- State the adoption boundary.
- Do not manufacture retroactive issues, PRs, or ADRs.

### Stage 2 --- Establish canonical documents

- Create or refine product philosophy and roadmap.
- Create `AGENTS.md` and `CONTRIBUTING.md`.
- Add the operating model and testing strategy.
- Record only the consequential ADRs whose rationale is known or can
  be decided now.

### Stage 3 --- Establish quality gates

- Make canonical local commands reliable.
- Add CI for formatting, lint, type-check, tests, and builds.
- Prioritize regression tests around manuscript integrity.
- Add Changeset validation and release checks.

### Stage 4 --- Use the workflow on the next real feature

Use Revision History v1 as the first substantial feature: - Create a
GitHub Issue if task coordination will help. - Write the canonical spec
in `docs/specs/`. - Record consequential architectural decisions as
ADRs. - Implement in focused commits or PRs. - Validate failure modes
and document the evidence. - Update the roadmap and release notes as
appropriate.

### Stage 5 --- Prepare for broader collaboration

- Add or refine GitHub issue and PR templates.
- Protect `main` and enforce appropriate CI checks.
- Define contribution and security processes.
- Invite external contributions only when review capacity and project
  expectations are clear.

---

## 14. Final operating rules

1.  The repository is the canonical home for durable product and
    engineering knowledge.
2.  GitHub Issues and PRs are the coordination and discussion layer, not
    a second documentation system.
3.  Do not mirror every issue, comment, board update, or CI result into
    Markdown.
4.  Promote consequential conclusions into canonical docs; preserve the
    original discussion where it occurred.
5.  Git history records implementation changes; tests and CI provide
    correctness evidence.
6.  Establish a dated opening baseline rather than retroactively
    inventing a perfect task history.
7.  Label uncertain historical facts and unverified behavior explicitly.
8.  Keep AI agents subject to the same tests, review, and safety
    constraints as human contributors.
9.  Keep the process lightweight for small work and rigorous for
    data-critical work.
10. Never let a task tracker be the sole location of a critical data
    contract or architectural invariant.

## Final principle

**Record the past honestly, document durable knowledge in the
repository, coordinate active work where it is easiest to manage, and
require evidence for claims about correctness.**

The purpose of the process is not to maximize documentation volume. It
is to preserve enough context that future-you, another engineer, or an
AI agent can understand why Scribo works the way it does, safely change
it, and verify the result.
