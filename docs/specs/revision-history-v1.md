# Revision History v1 — technical specification (draft)

**Status:** **Superseded** — replaced by Git-based history in [project-architecture-and-storage.md](./project-architecture-and-storage.md) (plan 005). Retained as historical alternative (linear `.scribo/revisions/`).  
**Roadmap:** Was Phase 2 under plan 003  
**Constitution:** [philosophy.md](../product/philosophy.md) · [invariants.md](../product/invariants.md)

**Non-goals for v1:** Branching, merge, three-way sync, cloud replication, Git semantics.

**Goal:** A writer can **inspect** prior states, **understand** differences at a useful granularity, and **restore** safely without losing the current draft unless they confirm.

---

## 1. Concepts

| Term                  | Definition                                                   |
| --------------------- | ------------------------------------------------------------ |
| **Checkpoint**        | Automatic snapshot created by the system on defined triggers |
| **Named version**     | User-created label on a checkpoint (optional v1 stretch)     |
| **Revision record**   | Immutable stored payload + metadata                          |
| **Current draft**     | Live editor state + last successful save                     |
| **Recovery snapshot** | Existing crash-recovery sidecar (orthogonal; see §6)         |

**Revision identity:** Each record has `revisionId` (UUID), `manuscriptId`, `parentRevisionId` (previous checkpoint in linear chain, or null for first), `createdAt` (RFC3339), `kind` (`auto` \| `named` \| `pre_restore`).

Linear history only in v1: at most one child per revision.

---

## 2. Triggers for automatic checkpoints

Proposed defaults (tunable constants):

| Trigger                           | Rationale                                              |
| --------------------------------- | ------------------------------------------------------ |
| Successful save after idle period | Captures meaningful milestones without every keystroke |
| Before explicit restore           | Enables undo-restore via `pre_restore` record          |
| Optional: first open of day       | Cheap session boundary                                 |

**Not in v1:** Per-keystroke history; checkpoints on failed saves.

**Open question:** Minimum interval between auto checkpoints (e.g. 5 minutes) to cap storage.

---

## 3. Stored payload

**Library manuscripts (Markdown on disk):**

- **Primary:** Normalized Markdown bytes (same normalization as save).
- **Optional hash:** SHA-256 of normalized content for deduplication.
- **Metadata:** Title at time of checkpoint (from document or file stem).

**Legacy internal (`ms_*`) if still supported:**

- Canonical `ProsaDocument` JSON (validated).

**Deduplication:** If normalized content hash equals previous checkpoint, skip creating a new record (update `lastSeenAt` only).

---

## 4. Storage layout

Under library root (alongside `.scribo/recovery`):

```
.scribo/
  revisions/
    {manuscriptId}/
      manifest.json      # ordered list of revisionIds + retention cursor
      {revisionId}.md    # or .json for internal
```

**Retention (v1 proposal):**

- Keep last **N** auto checkpoints (default 50) per manuscript.
- Never delete `pre_restore` until user dismisses or a newer restore occurs.
- Named versions (if shipped) exempt until user deletes.

**Bounds:** Manifest documents total bytes; UI warns if project exceeds configurable soft cap.

---

## 5. Diff granularity

**v1 UI:**

- **Section-level:** Split on Markdown headings (`#` … `######`) or Prosa heading blocks.
- **Paragraph-level:** Within changed sections, show added/removed/changed paragraphs (line-oriented diff on normalized text).

**Not v1:** Word-level diff in UI (optional future); semantic move detection.

Use a stable diff library (Rust or WASM) on normalized strings; same normalization as save to avoid noise.

---

## 6. Interaction with autosave and recovery

| Mechanism            | Role                                                            |
| -------------------- | --------------------------------------------------------------- |
| **Autosave**         | Writes current draft to `.md` + updates recovery sidecar        |
| **Recovery**         | Short-lived safety net after crash; may be newer than last save |
| **Revision history** | Longer-lived, intentional timeline                              |

Rules:

1. Creating a checkpoint runs **after** a successful save (same normalized content as on disk).
2. Recovery does **not** replace revision history; on open, recovery policy unchanged ([recovery-policy.ts](../../apps/prosa/src/features/persistence/recovery-policy.ts)).
3. Restore flow: flush pending edits → write `pre_restore` checkpoint from current saved file → replace draft from selected revision → save → new checkpoint.

---

## 7. External file changes

If mtime advances while app is open (existing external-change path):

- Do **not** auto-import into revision chain until user chooses **Reload from disk**.
- On reload: treat reloaded content as new save; optional checkpoint labeled `external_reload`.

If user edits file outside while app closed: next open loads disk; first in-app save creates checkpoint from that baseline.

---

## 8. Restore semantics

1. User selects revision → **preview** (read-only diff against current saved draft).
2. Confirm restore → `pre_restore` checkpoint → apply content → save → refresh editor.
3. Offer **Revert restore** if `pre_restore` exists (restore that payload).

Failed restore must leave prior `.md` unchanged (atomic write already used for saves).

---

## 9. Performance

- Checkpoints async after save (do not block UI save indicator).
- Diff computed on demand for selected revision pair, cached in memory LRU.
- Target: 200k-character manuscript — checkpoint write < 500 ms; section diff < 1 s on Apple Silicon class hardware.

---

## 10. API sketch (Tauri)

```
list_revisions(manuscriptId) -> RevisionSummary[]
create_named_revision(manuscriptId, label) -> RevisionSummary  // stretch
diff_revision(manuscriptId, revisionId, baseRevisionId?) -> DiffPayload
restore_revision(manuscriptId, revisionId) -> LoadedManuscript
delete_named_revision(manuscriptId, revisionId) -> ()
```

Implementation lives in Rust under `library.rs` or new `revisions.rs` module; TS adapter in `tauri-manuscripts.ts`.

---

## 11. Failure cases & tests

| Case                                   | Expected                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| Disk full on checkpoint                | Save still fails/succeeds independently; checkpoint error logged; no corrupt manifest |
| Corrupt manifest                       | History UI shows error; editing still works                                           |
| Restore interrupted                    | Atomic save invariant; `pre_restore` retained                                         |
| Duplicate content                      | No new revision row (hash dedupe)                                                     |
| Migration from pre-history manuscripts | Empty manifest; first save creates first checkpoint                                   |

**Tests:** Rust unit tests for manifest retention + dedupe; Vitest for restore confirmation flow mocks; integration test with temp library dir.

---

## 12. Export and portability

- Revisions live under `.scribo/revisions/` — document in user-facing help.
- Export manuscript (future) copies **current** `.md` only by default; optional “export with history” bundles `.scribo/revisions/{id}/` (zip).

---

## 13. Open decisions (resolve before coding)

1. Named versions in v1 or v1.1?
2. Default retention count and soft size cap.
3. Minimum interval between auto checkpoints.
4. Whether UI lives in sidebar, modal, or contextual workspace panel.

---

## 14. Implementation checklist

- [ ] Resolve open decisions
- [ ] Rust: `revisions.rs` + manifest format
- [ ] Hook checkpoint after successful `write_library_markdown`
- [ ] UI: revision list + diff preview + restore confirm
- [ ] Tests per §11
- [ ] Update [implementation-audit.md](../architecture/implementation-audit.md)
