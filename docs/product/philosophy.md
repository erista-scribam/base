# Scribo product constitution

**Status:** Active (adopted from [003-prosa-deep-writing-features.md](../plans/completed/003-prosa-deep-writing-features.md))  
**Scope:** Scribo Prosa first; principles apply to the wider Scribo family unless a product explicitly diverges.

This document is the **governing law** for product and engineering decisions. Detailed plans, specs, and roadmaps must not contradict it. When they conflict, update the plan or amend this document deliberately—not in code comments alone.

---

## Central proposition

> **The document is the output. The writer's thinking and working process is the product.**

Scribo is organized around the writer's work—not around the document editor as a visual object. The editor is one instrument in capture, research, outline, draft, revise, verify, and deliver.

Priority order for capabilities:

1. Protect and preserve the writer's work.
2. Reduce friction between thought and expression.
3. Make structure, meaning, and revision visible.
4. Keep research and source material close to the writing.
5. Support deliberate revision and long-term project development.
6. Make presentation consistent and largely automatic.
7. Expose advanced controls only when they solve a real writing problem.

The goal is not the smallest interface. The goal is the **least unnecessary cognitive overhead**.

---

## Product principles

| Principle                       | Meaning                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| **Writer-first**                | Evaluate features by writing outcomes, not control count.                           |
| **Content before presentation** | Semantic structure in the model; presentation is global and swappable.              |
| **Trust by default**            | Saves, recovery, conflicts, and analysis must be honest and reversible.             |
| **Analysis ≠ content**          | Diagnostics and annotations must not silently mutate the manuscript.                |
| **Local-first**                 | Editing must not require network, account, or vendor.                               |
| **Explainability**              | The writer should understand what the software did and why.                         |
| **Calm surface, deep tools**    | Power lives in modes, commands, and contextual workspaces—not permanent dashboards. |

---

## Questions before every feature

Do not ask, “What controls should an editor expose?” Ask:

- What is the writer trying to accomplish **right now**?
- What information would help the **next** decision?
- What can the software **safely** automate?
- What must stay under **explicit** human control?
- What must be **preserved** so the writer can return later?
- How can the writer move between drafting, research, analysis, and revision **without losing context**?

---

## Feature gate (prioritization)

Score proposals (roughly 1–5 or yes/no) on:

1. **Writer value** — Better produce, understand, revise, or deliver work?
2. **Frequency** — Recurring or consequential problem?
3. **Trust impact** — Protects work or reduces loss risk?
4. **Cognitive cost** — Less friction, not another panel to babysit?
5. **Explainability** — Clear behavior and outcomes?
6. **Reversibility** — Mistakes undoable safely?
7. **Architectural leverage** — Reusable boundary for later features?
8. **Maintenance cost** — Testable and ownable?
9. **Language/genre scope** — Explicit limits where needed?
10. **Evidence** — Observed in real writing, not competitor checklist?

**Decision rule:** Invisible reliability and persistence fixes may outrank flashy features. Broad “intelligence” waits until accuracy and failure modes are understood. A feature that adds machinery without improving the writer's work **does not ship**.

---

## Deliberate non-goals

- Permanent dashboard of metrics and panels on the writing surface.
- Typography and layout customization as the product center.
- Feature parity for its own sake.
- Treating inferred entities or grammar as ground truth.
- Silent rewrite during analysis, normalization, or sync.
- Full Git semantics before writers need them.
- Requiring AI, account, or cloud for basic editing.
- Collaboration before single-user integrity and conflict behavior are sound.
- Premature package explosion without a concrete boundary.
- Success measured by time spent in the app.

---

## Final test

> **Scribo should take responsibility for the machinery of writing so that the writer can take responsibility for the writing itself.**

If a change fails this test, it does not belong in the product.

---

## Related documents

| Document                                                                                                       | Role                          |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| [invariants.md](./invariants.md)                                                                               | Must-always-be-true rules     |
| [roadmap.md](./roadmap.md)                                                                                     | Phased delivery               |
| [known-limitations.md](./known-limitations.md)                                                                 | Current product gaps          |
| [../architecture/implementation-audit.md](../architecture/implementation-audit.md)                             | Code vs target subsystems     |
| [../specs/revision-history-v1.md](../specs/revision-history-v1.md)                                             | Revision history spec         |
| [../research/WRITING_FRICTION_LOG.md](../research/WRITING_FRICTION_LOG.md)                                     | Real-use friction log         |
| [../../MASTERPLAN.md](../../MASTERPLAN.md)                                                                     | Stack and monorepo foundation |
| [../plans/completed/003-prosa-deep-writing-features.md](../plans/completed/003-prosa-deep-writing-features.md) | Full strategy essay           |
