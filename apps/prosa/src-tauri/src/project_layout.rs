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

pub fn ensure_v1_manuscripts_dir(root: &Path) -> Result<PathBuf, String> {
    let path = root.join(LAYOUT_V1_MANUSCRIPTS);
    fs::create_dir_all(&path).map_err(|error| error.to_string())?;
    Ok(path)
}

pub fn ensure_v2_manuscripts_dir(root: &Path) -> Result<PathBuf, String> {
    let path = root.join(LAYOUT_V2_MANUSCRIPTS);
    fs::create_dir_all(&path).map_err(|error| error.to_string())?;
    Ok(path)
}

const LAYOUT_V2_CANON: &str = "contents/canon";
const LAYOUT_V1_CONTENT: &str = "content";

/// Moves `content/manuscripts` → `contents/canon/manuscripts` when v2 path is absent.
pub fn migrate_manuscripts_tree_v1_to_v2(root: &Path) -> Result<bool, String> {
    let v1 = root.join(LAYOUT_V1_MANUSCRIPTS);
    let v2 = root.join(LAYOUT_V2_MANUSCRIPTS);
    if !v1.is_dir() || v2.exists() {
        return Ok(false);
    }
    fs::create_dir_all(root.join(LAYOUT_V2_CANON)).map_err(|error| error.to_string())?;
    fs::rename(&v1, &v2).map_err(|error| error.to_string())?;
    let content_dir = root.join(LAYOUT_V1_CONTENT);
    if content_dir.is_dir()
        && fs::read_dir(&content_dir)
            .map_err(|error| error.to_string())?
            .next()
            .is_none()
    {
        fs::remove_dir(&content_dir).ok();
    }
    Ok(true)
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

    #[test]
    fn migrate_moves_v1_manuscripts_to_v2() {
        let root = std::env::temp_dir().join(format!("scribo-migrate-{}", uuid::Uuid::new_v4()));
        let v1 = root.join(LAYOUT_V1_MANUSCRIPTS);
        fs::create_dir_all(&v1).unwrap();
        fs::write(v1.join("chapter.mdprosa"), "# hi").unwrap();
        assert!(migrate_manuscripts_tree_v1_to_v2(&root).unwrap());
        assert!(
            root.join(LAYOUT_V2_MANUSCRIPTS)
                .join("chapter.mdprosa")
                .is_file()
        );
        assert!(!v1.exists());
        fs::remove_dir_all(&root).ok();
    }
}
