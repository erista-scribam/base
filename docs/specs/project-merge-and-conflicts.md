# Project merge and conflict resolution (Phase 5)

**Status:** Active  
**Parent:** [project-version-control-ui.md](./project-version-control-ui.md)

## Scope (v1)

- Merge **local branch B into current branch A** from the source control panel.
- **Fast-forward**, **already up to date**, and **conflict** outcomes are explicit in UI.
- Conflicts on **project files** (primarily `content/manuscripts/*.md`); resolution strategies: **keep current branch**, **keep incoming branch**, **keep both** (stacked).
- **Abort merge** restores pre-merge state.
- **Complete merge** after all conflict markers are removed from disk/index.

## Non-negotiables

- No silent merge failure; no silent discard of authored text during resolution.
- User chooses ours/theirs/both per conflicted **file** in v1 (not per hunk UI yet).
- Git operations flush editor saves first (existing `onBeforeGitOperation`).
- After merge changes disk, open manuscripts reload when `workspaceUpdated` is set.

## Out of scope (v1)

- Push/pull, cherry-pick, rebase.
- Per-hunk conflict editor in TipTap (conflicted `.md` may be edited in Markdown view or via file actions).
- Auto-merge policy without user confirmation.

## Acceptance

1. Diverged branches → merge → conflict list appears; files contain standard conflict markers.
2. Resolve each file → Complete merge → merge commit; graph updates.
3. Abort merge → clean tree matching pre-merge HEAD.
4. Merge blocked when working tree has uncommitted changes (outside an in-progress merge).
