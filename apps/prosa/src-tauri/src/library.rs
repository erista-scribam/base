use std::fs;
use std::path::{Component, Path, PathBuf};

use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::Manager;

use crate::atomic_io::atomic_write;
use crate::persistence::ManuscriptSummary;

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

pub fn ensure_default_library(app: &AppHandle) -> Result<LibraryInfo, String> {
    if let Some(config) = read_config(app)? {
        let exists = config.root_path.exists();
        fs::create_dir_all(&config.root_path).map_err(|error| error.to_string())?;
        return Ok(LibraryInfo {
            root_path: config.root_path.to_string_lossy().into_owned(),
            exists,
        });
    }

    let root = default_library_root(app)?;
    fs::create_dir_all(&root).map_err(|error| error.to_string())?;
    write_config(
        app,
        &LibraryConfig {
            root_path: root.clone(),
        },
    )?;
    Ok(LibraryInfo {
        root_path: root.to_string_lossy().into_owned(),
        exists: true,
    })
}

pub fn get_library_info(app: &AppHandle) -> Result<LibraryInfo, String> {
    if let Some(config) = read_config(app)? {
        return Ok(LibraryInfo {
            root_path: config.root_path.to_string_lossy().into_owned(),
            exists: config.root_path.exists(),
        });
    }
    let root = default_library_root(app)?;
    Ok(LibraryInfo {
        root_path: root.to_string_lossy().into_owned(),
        exists: root.exists(),
    })
}

pub fn set_library_root(app: &AppHandle, root_path: String) -> Result<LibraryInfo, String> {
    let path = PathBuf::from(&root_path);
    fs::create_dir_all(&path).map_err(|error| error.to_string())?;
    write_config(app, &LibraryConfig { root_path: path.clone() })?;
    Ok(LibraryInfo {
        root_path: path.to_string_lossy().into_owned(),
        exists: true,
    })
}

pub fn manuscript_id_for_path(path_key: &str) -> String {
    format!("{PATH_ID_PREFIX}{}", URL_SAFE_NO_PAD.encode(path_key.as_bytes()))
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

fn walk_markdown_files(root: &Path, dir: &Path, entries: &mut Vec<(PathBuf, String)>) -> Result<(), String> {
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
        .filter_map(|(absolute, rel)| {
            let modified = fs::metadata(&absolute)
                .ok()
                .and_then(|meta| meta.modified().ok())
                .map(|time| {
                    chrono::DateTime::<Utc>::from(time)
                        .to_rfc3339()
                })
                .unwrap_or_else(|| Utc::now().to_rfc3339());
            Some(ManuscriptSummary {
                id: manuscript_id_for_path(&rel),
                title: title_from_path(&absolute),
                updated_at: modified,
                file_path: Some(rel),
                source: Some("library".into()),
            })
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

pub fn write_library_markdown(app: &AppHandle, path_key: String, markdown: String) -> Result<ManuscriptSummary, String> {
    let config = read_config(app)?.ok_or("Library is not configured")?;
    let path = resolve_library_path(&config.root_path, &path_key)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    atomic_write(&path, &markdown)?;
    let rel = if path.starts_with(&config.root_path) {
        path.strip_prefix(&config.root_path)
            .map_err(|error| error.to_string())?
            .to_string_lossy()
            .into_owned()
    } else {
        path.to_string_lossy().into_owned()
    };
    let modified = fs::metadata(&path)
        .ok()
        .and_then(|meta| meta.modified().ok())
        .map(|time| chrono::DateTime::<Utc>::from(time).to_rfc3339())
        .unwrap_or_else(|| Utc::now().to_rfc3339());
    Ok(ManuscriptSummary {
        id: manuscript_id_for_path(&rel),
        title: title_from_path(&path),
        updated_at: modified,
        file_path: Some(rel),
        source: Some("library".into()),
    })
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
    let base_name = title
        .chars()
        .map(|ch| if ch.is_ascii_alphanumeric() || ch == ' ' || ch == '-' || ch == '_' {
            ch
        } else {
            ' '
        })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ");
    let base_name = if base_name.is_empty() {
        "Untitled".to_string()
    } else {
        base_name
    };

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

pub fn create_library_markdown(app: &AppHandle, title: String) -> Result<(ManuscriptSummary, String), String> {
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
    let modified = fs::metadata(&path)
        .ok()
        .and_then(|meta| meta.modified().ok())
        .map(|time| chrono::DateTime::<Utc>::from(time).to_rfc3339())
        .unwrap_or_else(|| Utc::now().to_rfc3339());
    Ok((
        ManuscriptSummary {
            id: manuscript_id_for_path(&rel),
            title: title_from_path(&path),
            updated_at: modified,
            file_path: Some(rel),
            source: Some("library".into()),
        },
        markdown,
    ))
}

pub fn import_external_markdown(_app: &AppHandle, absolute_path: String) -> Result<(ManuscriptSummary, String), String> {
    let path = PathBuf::from(&absolute_path);
    if !path.is_absolute() {
        return Err("Path must be absolute".into());
    }
    if !path.exists() || !is_markdown_file(&path) {
        return Err("Not a markdown file".into());
    }
    let markdown = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    let path_key = path.to_string_lossy().into_owned();
    let modified = fs::metadata(&path)
        .ok()
        .and_then(|meta| meta.modified().ok())
        .map(|time| chrono::DateTime::<Utc>::from(time).to_rfc3339())
        .unwrap_or_else(|| Utc::now().to_rfc3339());
    Ok((
        ManuscriptSummary {
            id: manuscript_id_for_path(&path_key),
            title: title_from_path(&path),
            updated_at: modified,
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
