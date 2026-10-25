# Scribo Prosa — Reliability Notes

## Canonical model

The Prosa document model (`@scribo/document-model`) is the source of truth in memory.

**Library folder** (default `Documents/Scribo Prosa`): each manuscript is a `.md` file you can open in Finder. **App config** (e.g. `com.scribo.prosa`) holds library settings and recovery snapshots under `.scribo/recovery/` inside the library — not your manuscript text.

Legacy manuscripts that were created in app storage are **migrated automatically** to the library as `.md` on launch.

## Saves

- Edits debounce (**800ms**) with a **3s** maximum wait before flush.
- One in-flight save per manuscript; **older saves cannot mark the UI as saved** if newer edits exist.
- Recovery snapshots are written before each successful save attempt.
- Internal and library files use **atomic writes** (temp file + rename + fsync).
- Document JSON is validated in Rust before internal JSON commits.

## Save status

| Status | Meaning |
|--------|---------|
| Unsaved changes | Edits not yet flushed |
| Saving… | Persist in progress |
| Saved | Last flush succeeded |
| Save failed | Disk error; edits remain in memory |

## Recovery

Recovery files use a versioned envelope with `capturedAt`. On open, recovery is used **only when**:

1. It validates against the schema, and
2. It is **newer than** the last saved revision, and
3. Content differs from the saved document.

Corrupt or older recovery never replaces a valid saved file.

## External changes

When the app regains focus, it compares the manuscript file mtime to the value at open. If the file changed on disk (Finder, another editor), a **Reload from disk** banner appears.

## Limits

- Not every keystroke is guaranteed after a hard kill; recovery covers the last successful recovery snapshot (typically within a few seconds of editing).
- Network sync is out of scope.
- Manuscript text is not written to logs.
