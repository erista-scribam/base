use std::path::{Path, PathBuf};

pub const APP_LOCAL_DIR: &str = ".scribam";
pub const LEGACY_APP_LOCAL_DIR: &str = ".scribo";
pub const LEGACY_PROJECT_MANIFEST_FILE: &str = "scribo.project.json";

/// Prefer `.scribam`, fall back to legacy `.scribo` when present.
pub fn resolve_app_local_dir(root: &Path) -> PathBuf {
    let preferred = root.join(APP_LOCAL_DIR);
    if preferred.is_dir() {
        return preferred;
    }
    let legacy = root.join(LEGACY_APP_LOCAL_DIR);
    if legacy.is_dir() {
        return legacy;
    }
    preferred
}

pub fn recovery_dir(root: &Path) -> PathBuf {
    resolve_app_local_dir(root).join("recovery")
}
