use std::fs;
use std::path::{Component, Path, PathBuf};
use std::time::SystemTime;

use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::Manager;

use crate::atomic_io::atomic_write;
use crate::persistence::ManuscriptSummary;
use crate::project::{ScriboProjectManifest, ensure_project_manifest, read_project_manifest};

const LIBRARY_DIR_NAME: &str = "Scribo Prosa";
const PATH_ID_PREFIX: &str = "ms_path_";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LibraryConfig {
    root_path: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryInfo {
    pub root_path: String,
    pub exists: bool,
    pub project: Option<ScriboProjectManifest>,
}

fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?
        .join("library.json"))
}

fn read_config(app: &AppHandle) -> Result<Option<LibraryConfig>, String> {
    let path = config_path(app)?;
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&raw).map_err(|error| error.to_string())
}

fn write_config(app: &AppHandle, config: &LibraryConfig) -> Result<(), String> {
    let path = config_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let raw = serde_json::to_string_pretty(config).map_err(|error| error.to_string())?;
    fs::write(path, raw).map_err(|error| error.to_string())
}

pub fn default_library_root(app: &AppHandle) -> Result<PathBuf, String> {
    let docs = app
        .path()
        .document_dir()
        .map_err(|error| error.to_string())?;
    Ok(docs.join(LIBRARY_DIR_NAME))
}

fn library_info_for_root(root: PathBuf, existed_before: bool) -> Result<LibraryInfo, String> {
    fs::create_dir_all(&root).map_err(|error| error.to_string())?;
    let project = Some(ensure_project_manifest(&root)?);
    Ok(LibraryInfo {
        root_path: root.to_string_lossy().into_owned(),
        exists: existed_before,
        project,
    })
}

pub fn ensure_default_library(app: &AppHandle) -> Result<LibraryInfo, String> {
    if let Some(config) = read_config(app)? {
        let existed = config.root_path.exists();
        return library_info_for_root(config.root_path, existed);
    }

    let root = default_library_root(app)?;
    write_config(
        app,
        &LibraryConfig {
            root_path: root.clone(),
        },
    )?;
    library_info_for_root(root, true)
}

pub fn get_library_info(app: &AppHandle) -> Result<LibraryInfo, String> {
    if let Some(config) = read_config(app)? {
        let root = config.root_path;
        let project = read_project_manifest(&root)?;
        return Ok(LibraryInfo {
            root_path: root.to_string_lossy().into_owned(),
            exists: root.exists(),
            project,
        });
    }
    let root = default_library_root(app)?;
    Ok(LibraryInfo {
        root_path: root.to_string_lossy().into_owned(),
        exists: root.exists(),
        project: if root.exists() {
            read_project_manifest(&root)?
        } else {
            None
        },
    })
}

pub fn set_library_root(app: &AppHandle, root_path: String) -> Result<LibraryInfo, String> {
    let path = PathBuf::from(&root_path);
    write_config(
        app,
        &LibraryConfig {
            root_path: path.clone(),
        },
    )?;
    library_info_for_root(path, true)
}

pub fn manuscript_id_for_path(path_key: &str) -> String {
    format!(
        "{PATH_ID_PREFIX}{}",
        URL_SAFE_NO_PAD.encode(path_key.as_bytes())
    )
}

pub fn path_key_for_manuscript_id(id: &str) -> Option<String> {
    let encoded = id.strip_prefix(PATH_ID_PREFIX)?;
    let bytes = URL_SAFE_NO_PAD.decode(encoded).ok()?;
    String::from_utf8(bytes).ok()
}

pub fn is_library_manuscript_id(id: &str) -> bool {
    id.starts_with(PATH_ID_PREFIX)
}

fn is_markdown_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .is_some_and(|ext| ext.eq_ignore_ascii_case("md") || ext.eq_ignore_ascii_case("markdown"))
}

fn title_from_path(path: &Path) -> String {
    path.file_stem()
        .and_then(|stem| stem.to_str())
        .unwrap_or("Untitled")
        .to_string()
}

fn is_safe_library_path(root: &Path, candidate: &Path) -> bool {
    if !candidate.starts_with(root) {
        return false;
    }
    for component in candidate.components() {
        if matches!(component, Component::ParentDir) {
            return false;
        }
    }
    true
}

fn resolve_library_path(root: &Path, path_key: &str) -> Result<PathBuf, String> {
    if Path::new(path_key).is_absolute() {
        return Ok(PathBuf::from(path_key));
    }
    let candidate = root.join(path_key);
    if !is_safe_library_path(root, &candidate) {
        return Err("Invalid library path".into());
    }
    Ok(candidate)
}

fn walk_markdown_files(
    root: &Path,
    dir: &Path,
    entries: &mut Vec<(PathBuf, String)>,
) -> Result<(), String> {
    for entry in fs::read_dir(dir).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        if path
            .file_name()
            .and_then(|name| name.to_str())
            .is_some_and(|name| name.starts_with('.') || name == ".scribo")
        {
            continue;
        }
        let file_type = entry.file_type().map_err(|error| error.to_string())?;
        if file_type.is_dir() {
            if path.file_name().is_some_and(|name| name == ".scribo") {
                continue;
            }
            walk_markdown_files(root, &path, entries)?;
            continue;
        }
        if !is_markdown_file(&path) {
            continue;
        }
        let rel = path
            .strip_prefix(root)
            .map_err(|error| error.to_string())?
            .to_string_lossy()
            .into_owned();
        entries.push((path, rel));
    }
    Ok(())
}

fn rfc3339_from_system_time(time: SystemTime) -> String {
    chrono::DateTime::<Utc>::from(time).to_rfc3339()
}

pub fn file_created_modified(path: &Path) -> (String, String) {
    let meta = fs::metadata(path).ok();
    let modified = meta
        .as_ref()
        .and_then(|m| m.modified().ok())
        .map(rfc3339_from_system_time)
        .unwrap_or_else(|| Utc::now().to_rfc3339());
    let created = meta
        .as_ref()
        .and_then(|m| m.created().ok())
        .map(rfc3339_from_system_time)
        .unwrap_or_else(|| modified.clone());
    (created, modified)
}

pub fn list_library_manuscripts(app: &AppHandle) -> Result<Vec<ManuscriptSummary>, String> {
    let Some(config) = read_config(app)? else {
        return Ok(Vec::new());
    };
    if !config.root_path.exists() {
        return Ok(Vec::new());
    }

    let mut files = Vec::new();
    walk_markdown_files(&config.root_path, &config.root_path, &mut files)?;

    let mut summaries = files
        .into_iter()
        .map(|(absolute, rel)| {
            let (created, modified) = file_created_modified(&absolute);
            ManuscriptSummary {
                id: manuscript_id_for_path(&rel),
                title: title_from_path(&absolute),
                updated_at: modified,
                created_at: Some(created),
                file_path: Some(rel),
                source: Some("library".into()),
            }
        })
        .collect::<Vec<_>>();

    summaries.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(summaries)
}

pub fn read_library_markdown(app: &AppHandle, path_key: String) -> Result<String, String> {
    let config = read_config(app)?.ok_or("Library is not configured")?;
    let path = resolve_library_path(&config.root_path, &path_key)?;
    if !path.exists() {
        return Err("File not found".into());
    }
    fs::read_to_string(path).map_err(|error| error.to_string())
}

fn is_forbidden_filename_char(ch: char) -> bool {
    matches!(ch, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|') || ch.is_control()
}

/// Filesystem-safe stem: keep punctuation such as `(Draft)`; strip path separators only.
fn sanitize_title_for_filename(title: &str) -> String {
    let base_name = title
        .chars()
        .map(|ch| {
            if is_forbidden_filename_char(ch) {
                ' '
            } else {
                ch
            }
        })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ");
    if base_name.is_empty() {
        "Untitled".to_string()
    } else {
        base_name
    }
}

/// Pick `{sanitized title}.md` in `parent`, avoiding collisions except `current`.
fn sibling_markdown_path(parent: &Path, title: &str, current: &Path) -> PathBuf {
    let base_name = sanitize_title_for_filename(title);
    let mut candidate = parent.join(format!("{base_name}.md"));
    if candidate == current {
        return candidate;
    }
    let mut counter = 2;
    while candidate.exists() && candidate != current {
        candidate = parent.join(format!("{base_name} {counter}.md"));
        counter += 1;
    }
    candidate
}

pub fn write_library_markdown(
    app: &AppHandle,
    path_key: String,
    title: Option<String>,
    markdown: String,
) -> Result<ManuscriptSummary, String> {
    let config = read_config(app)?.ok_or("Library is not configured")?;
    let current_path = resolve_library_path(&config.root_path, &path_key)?;
    let parent = current_path
        .parent()
        .ok_or("Invalid manuscript path")?
        .to_path_buf();
    fs::create_dir_all(&parent).map_err(|error| error.to_string())?;

    let display_title = title
        .as_deref()
        .filter(|t| !t.trim().is_empty())
        .map(str::trim)
        .unwrap_or_else(|| {
            current_path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Untitled")
        });

    let target_path = sibling_markdown_path(&parent, display_title, &current_path);
    atomic_write(&target_path, &markdown)?;
    if target_path != current_path && current_path.exists() {
        fs::remove_file(&current_path).map_err(|error| error.to_string())?;
    }

    let rel = if target_path.starts_with(&config.root_path) {
        target_path
            .strip_prefix(&config.root_path)
            .map_err(|error| error.to_string())?
            .to_string_lossy()
            .into_owned()
    } else {
        target_path.to_string_lossy().into_owned()
    };
    let (created, modified) = file_created_modified(&target_path);
    Ok(ManuscriptSummary {
        id: manuscript_id_for_path(&rel),
        title: display_title.to_string(),
        updated_at: modified,
        created_at: Some(created),
        file_path: Some(rel),
        source: Some("library".into()),
    })
}

pub fn delete_library_manuscript(app: &AppHandle, id: &str) -> Result<(), String> {
    let path_key = path_key_for_manuscript_id(id).ok_or("Invalid library manuscript id")?;
    clear_library_recovery(app, &path_key)?;
    let path = absolute_path_for_entry(app, &path_key)?;
    if path.exists() {
        fs::remove_file(&path).map_err(|error| error.to_string())?;
    }
    Ok(())
}

pub fn library_recovery_path(app: &AppHandle, path_key: &str) -> Result<PathBuf, String> {
    let config = read_config(app)?.ok_or("Library is not configured")?;
    let dir = config.root_path.join(".scribo/recovery");
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    let hash = URL_SAFE_NO_PAD.encode(path_key.as_bytes());
    Ok(dir.join(format!("{hash}.json")))
}

pub fn clear_library_recovery(app: &AppHandle, path_key: &str) -> Result<(), String> {
    let path = library_recovery_path(app, path_key)?;
    if path.exists() {
        fs::remove_file(path).map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn unique_markdown_path(root: &Path, title: &str) -> Result<(PathBuf, String), String> {
    let base_name = sanitize_title_for_filename(title);

    let mut candidate = root.join(format!("{base_name}.md"));
    let mut counter = 2;
    while candidate.exists() {
        candidate = root.join(format!("{base_name} {counter}.md"));
        counter += 1;
    }

    let rel = candidate
        .strip_prefix(root)
        .map_err(|error| error.to_string())?
        .to_string_lossy()
        .into_owned();
    Ok((candidate, rel))
}

pub fn create_library_markdown(
    app: &AppHandle,
    title: String,
) -> Result<(ManuscriptSummary, String), String> {
    create_library_markdown_with_content(app, title, String::new())
}

pub fn create_library_markdown_with_content(
    app: &AppHandle,
    title: String,
    markdown: String,
) -> Result<(ManuscriptSummary, String), String> {
    let config = read_config(app)?.ok_or("Library is not configured")?;
    fs::create_dir_all(&config.root_path).map_err(|error| error.to_string())?;

    let (path, rel) = unique_markdown_path(&config.root_path, &title)?;
    atomic_write(&path, &markdown)?;
    let (created, modified) = file_created_modified(&path);
    Ok((
        ManuscriptSummary {
            id: manuscript_id_for_path(&rel),
            title: title_from_path(&path),
            updated_at: modified,
            created_at: Some(created),
            file_path: Some(rel),
            source: Some("library".into()),
        },
        markdown,
    ))
}

pub fn import_external_markdown(
    _app: &AppHandle,
    absolute_path: String,
) -> Result<(ManuscriptSummary, String), String> {
    let path = PathBuf::from(&absolute_path);
    if !path.is_absolute() {
        return Err("Path must be absolute".into());
    }
    if !path.exists() || !is_markdown_file(&path) {
        return Err("Not a markdown file".into());
    }
    let markdown = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    let path_key = path.to_string_lossy().into_owned();
    let (created, modified) = file_created_modified(&path);
    Ok((
        ManuscriptSummary {
            id: manuscript_id_for_path(&path_key),
            title: title_from_path(&path),
            updated_at: modified,
            created_at: Some(created),
            file_path: Some(path_key),
            source: Some("library".into()),
        },
        markdown,
    ))
}

pub fn absolute_path_for_entry(app: &AppHandle, path_key: &str) -> Result<PathBuf, String> {
    if Path::new(path_key).is_absolute() {
        return Ok(PathBuf::from(path_key));
    }
    let config = read_config(app)?.ok_or("Library is not configured")?;
    Ok(config.root_path.join(path_key))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn sanitize_title_for_filename_strips_unsafe_chars() {
        assert_eq!(
            sanitize_title_for_filename("  Hello: World!!  "),
            "Hello World!!"
        );
        assert_eq!(
            sanitize_title_for_filename("Bianglala (Draft)"),
            "Bianglala (Draft)"
        );
        assert_eq!(sanitize_title_for_filename("   "), "Untitled");
        assert_eq!(sanitize_title_for_filename("bad/name"), "bad name");
    }

    #[test]
    fn sibling_markdown_path_renames_without_collision() {
        let dir = std::env::temp_dir().join(format!("scribo-lib-test-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&dir).unwrap();
        let current = dir.join("Old Name.md");
        fs::write(&current, "# old").unwrap();

        let next = sibling_markdown_path(&dir, "New Name", &current);
        assert_eq!(next, dir.join("New Name.md"));

        fs::remove_dir_all(&dir).ok();
    }
}
