# Layout v2 migration (stub)

**Status:** Draft — Phase A gate for [plan 006](../plans/active/006-scribo-lanista-platform.md)

## From → To

| v1 (005 transitional)           | v2 (006)                                   |
| ------------------------------- | ------------------------------------------ |
| Prosa as hub; `library.json`    | Lanista catalog + grants                   |
| Project-root `.git`             | Per-manuscript `.git`                      |
| `.md` in `content/manuscripts/` | `.mdprosa`                                 |
| Optional flat manuscripts       | Manuscript **packages** (directory per ms) |

## Steps M0–M5

See [plan 006 §7](../plans/active/006-scribo-lanista-platform.md).

## Safety

- M0: mandatory backup offer before M2–M3.
- Idempotent migration flag on `scribo.project.json`.
- Block Prosa open on partial migration (fail closed).
