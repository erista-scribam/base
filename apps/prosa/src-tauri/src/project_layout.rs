use std::fs;
use std::path::{Path, PathBuf};

pub const LAYOUT_V1_MANUSCRIPTS: &str = "content/manuscripts";
pub const LAYOUT_V2_MANUSCRIPTS: &str = "contents/canon/manuscripts";

pub const MANUSCRIPT_PROSE_EXTENSION: &str = "mdprosa";

/// Active manuscripts tree: prefer v2 when present, else v1.
pub fn resolve_manuscripts_dir(root: &Path) -> PathBuf {
    let v2 = root.join(LAYOUT_V2_MANUSCRIPTS);
    if v2.is_dir() {
        return v2;
    }
    root.join(LAYOUT_V1_MANUSCRIPTS)
}

/// New projects still bootstrap layout v1 paths (dual-read v2 when created manually).
pub fn ensure_v1_manuscripts_dir(root: &Path) -> Result<PathBuf, String> {
    let path = root.join(LAYOUT_V1_MANUSCRIPTS);
    fs::create_dir_all(&path).map_err(|error| error.to_string())?;
    Ok(path)
}

pub fn is_manuscript_prose_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .is_some_and(|ext| {
            ext.eq_ignore_ascii_case("md")
                || ext.eq_ignore_ascii_case("markdown")
                || ext.eq_ignore_ascii_case(MANUSCRIPT_PROSE_EXTENSION)
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_prefers_v2_when_directory_exists() {
        let root = std::env::temp_dir().join(format!("scribo-layout-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(root.join(LAYOUT_V2_MANUSCRIPTS)).unwrap();
        assert_eq!(
            resolve_manuscripts_dir(&root),
            root.join(LAYOUT_V2_MANUSCRIPTS)
        );
        fs::remove_dir_all(&root).ok();
    }
}
