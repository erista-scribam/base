use std::path::{Component, Path};

pub const ERR_SCRIBAM_PATH_FORBIDDEN: &str = "ERR_SCRIBAM_PATH_FORBIDDEN";

fn normalize_relative(rel: &str) -> String {
    rel.replace('\\', "/").trim_start_matches('/').to_string()
}

fn is_under_prefix(rel: &str, prefix: &str) -> bool {
    let rel = normalize_relative(rel);
    let prefix = normalize_relative(prefix);
    rel == prefix || rel.starts_with(&format!("{prefix}/"))
}

pub fn is_prosa_manuscript_relative(rel: &str) -> bool {
    is_under_prefix(rel, crate::project_layout::LAYOUT_V1_MANUSCRIPTS)
        || is_under_prefix(rel, crate::project_layout::LAYOUT_V2_MANUSCRIPTS)
}

pub fn assert_prosa_manuscript_relative(rel: &str) -> Result<(), String> {
    if rel.split('/').any(|segment| segment == "..") {
        return Err(format!("{ERR_SCRIBAM_PATH_FORBIDDEN}: invalid path"));
    }
    if !is_prosa_manuscript_relative(rel) {
        return Err(format!(
            "{ERR_SCRIBAM_PATH_FORBIDDEN}: not in Prosa manuscript tree"
        ));
    }
    Ok(())
}

pub fn assert_prosa_manuscript_absolute(root: &Path, absolute: &Path) -> Result<(), String> {
    if !absolute.starts_with(root) {
        return Err(format!("{ERR_SCRIBAM_PATH_FORBIDDEN}: outside project"));
    }
    for component in absolute.components() {
        if matches!(component, Component::ParentDir) {
            return Err(format!("{ERR_SCRIBAM_PATH_FORBIDDEN}: invalid path"));
        }
    }
    let rel = absolute
        .strip_prefix(root)
        .map_err(|error| error.to_string())?
        .to_string_lossy();
    assert_prosa_manuscript_relative(&rel)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn allows_v1_and_v2_manuscript_paths() {
        assert!(is_prosa_manuscript_relative("content/manuscripts/a.md"));
        assert!(is_prosa_manuscript_relative(
            "contents/canon/manuscripts/b.mdprosa"
        ));
        assert!(!is_prosa_manuscript_relative("contents/canon/folia/x"));
    }
}
