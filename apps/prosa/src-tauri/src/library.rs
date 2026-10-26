use std::fs;
use std::path::{Component, Path, PathBuf};
use std::time::SystemTime;

use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::Manager;

use crate::atomic_io::atomic_write;
use crate::grants::assert_prosa_manuscript_absolute;
use crate::persistence::ManuscriptSummary;
use crate::project::{
    PROJECT_MANIFEST_FILE, ScriboProjectManifest, ensure_project_manifest, manuscripts_dir,
    read_project_manifest,
};
use crate::project_layout::{MANUSCRIPT_PROSE_EXTENSION, is_manuscript_prose_file};

const LIBRARY_DIR_NAME: &str = "Scribo Prosa";
const PATH_ID_PREFIX: &str = "ms_path_";

const MAX_RECENT_PROJECTS: usize = 12;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RecentProjectEntry {
    root_path: PathBuf,
    last_opened_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LibraryConfig {
    /// Active project root (Git, manuscripts, explorer).
    root_path: PathBuf,
    /// Prosa container folder (Documents/Scribo Prosa); projects live in subfolders.
    #[serde(default)]
    home_path: Option<PathBuf>,
    #[serde(default)]
    recent_projects: Vec<RecentProjectEntry>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSummary {
    pub root_path: String,
    pub title: String,
    pub id: Option<String>,
    pub last_opened_at: String,
    pub is_current: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryInfo {
    pub root_path: String,
    pub home_path: String,
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

fn touch_recent_project(config: &mut LibraryConfig, root: &Path) {
    let now = Utc::now().to_rfc3339();
    config
        .recent_projects
        .retain(|entry| entry.root_path != root);
    config.recent_projects.insert(
        0,
        RecentProjectEntry {
            root_path: root.to_path_buf(),
            last_opened_at: now,
        },
    );
    config.recent_projects.truncate(MAX_RECENT_PROJECTS);
}

fn project_title_for_root(root: &Path) -> String {
    read_project_manifest(root)
        .ok()
        .flatten()
        .map(|manifest| manifest.title)
        .unwrap_or_else(|| {
            root.file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("Untitled project")
                .to_string()
        })
}

fn paths_equal(a: &Path, b: &Path) -> bool {
    match (fs::canonicalize(a), fs::canonicalize(b)) {
        (Ok(a), Ok(b)) => a == b,
        _ => a == b,
    }
}

fn is_project_directory(path: &Path) -> bool {
    path.join(PROJECT_MANIFEST_FILE).is_file()
}

fn resolve_home_path(app: &AppHandle, config: &LibraryConfig) -> Result<PathBuf, String> {
    Ok(config
        .home_path
        .clone()
        .unwrap_or_else(|| default_library_root(app).unwrap_or_else(|_| config.root_path.clone())))
}

fn bootstrap_first_project(home: &Path) -> Result<PathBuf, String> {
    fs::create_dir_all(home).map_err(|error| error.to_string())?;
    let dest = unique_folder_path(home, "Untitled");
    fs::create_dir_all(&dest).map_err(|error| error.to_string())?;
    ensure_project_manifest(&dest)?;
    Ok(dest)
}

fn remap_recent_paths_from_home(config: &mut LibraryConfig, home: &Path, new_project: &Path) {
    for entry in &mut config.recent_projects {
        if paths_equal(&entry.root_path, home) {
            entry.root_path = new_project.to_path_buf();
        }
    }
}

/// Moves a legacy project that lived at the Prosa home root into `home/<title>/`.
fn migrate_embedded_project_from_home(home: &Path) -> Result<PathBuf, String> {
    let manifest = read_project_manifest(home)?.ok_or("Expected project manifest at Prosa home")?;
    let dest = unique_folder_path(home, &manifest.title);
    fs::create_dir_all(&dest).map_err(|error| error.to_string())?;

    for name in ["scribo.project.json", "content", ".git", ".scribo"] {
        let src = home.join(name);
        if src.exists() {
            fs::rename(&src, dest.join(name))
                .map_err(|error| format!("Failed to move {name}: {error}"))?;
        }
    }

    for entry in fs::read_dir(home).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        if path.is_file() && is_manuscript_prose_file(&path) {
            fs::rename(&path, dest.join(entry.file_name())).map_err(|error| error.to_string())?;
        }
    }

    Ok(dest)
}

fn discover_projects_in_home(home: &Path) -> Vec<PathBuf> {
    let mut paths = Vec::new();
    let entries = match fs::read_dir(home) {
        Ok(entries) => entries,
        Err(_) => return paths,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() && is_project_directory(&path) {
            paths.push(path);
        }
    }
    paths.sort_by(|a, b| a.file_name().cmp(&b.file_name()));
    paths
}

fn ensure_config_normalized(app: &AppHandle) -> Result<LibraryConfig, String> {
    let default_home = default_library_root(app)?;

    let mut config = match read_config(app)? {
        Some(mut existing) => {
            if existing.home_path.is_none() {
                existing.home_path = Some(default_home.clone());
            }
            existing
        }
        None => {
            fs::create_dir_all(&default_home).map_err(|error| error.to_string())?;
            let project = bootstrap_first_project(&default_home)?;
            let mut fresh = LibraryConfig {
                home_path: Some(default_home.clone()),
                root_path: project.clone(),
                recent_projects: Vec::new(),
            };
            touch_recent_project(&mut fresh, &project);
            write_config(app, &fresh)?;
            return Ok(fresh);
        }
    };

    let home = config
        .home_path
        .clone()
        .unwrap_or_else(|| default_home.clone());
    fs::create_dir_all(&home).map_err(|error| error.to_string())?;

    let active_is_home = paths_equal(&config.root_path, &home);

    if active_is_home && is_project_directory(&home) {
        let migrated = migrate_embedded_project_from_home(&home)?;
        config.root_path = migrated.clone();
        remap_recent_paths_from_home(&mut config, &home, &migrated);
        touch_recent_project(&mut config, &migrated);
        write_config(app, &config)?;
    } else if active_is_home && !is_project_directory(&home) {
        let project = bootstrap_first_project(&home)?;
        config.root_path = project.clone();
        touch_recent_project(&mut config, &project);
        write_config(app, &config)?;
    }

    Ok(config)
}

fn library_info_for_root(
    root: PathBuf,
    home: PathBuf,
    existed_before: bool,
) -> Result<LibraryInfo, String> {
    fs::create_dir_all(&root).map_err(|error| error.to_string())?;
    let project = Some(ensure_project_manifest(&root)?);
    #[cfg(feature = "git-vcs")]
    {
        let _ = crate::project_git::ensure_project_git(&root);
    }
    Ok(LibraryInfo {
        root_path: root.to_string_lossy().into_owned(),
        home_path: home.to_string_lossy().into_owned(),
        exists: existed_before,
        project,
    })
}

/// When Lanista (or dev) sets `SCRIBO_PROJECT_ROOT`, open that project instead of the catalog default.
pub fn open_library_from_env(app: &AppHandle) -> Option<Result<LibraryInfo, String>> {
    let root = std::env::var("SCRIBO_PROJECT_ROOT").ok()?;
    let trimmed = root.trim();
    if trimmed.is_empty() {
        return None;
    }
    Some(open_project_root(app, PathBuf::from(trimmed)))
}

pub fn ensure_default_library(app: &AppHandle) -> Result<LibraryInfo, String> {
    let config = ensure_config_normalized(app)?;
    let home = resolve_home_path(app, &config)?;
    let existed = config.root_path.exists();
    library_info_for_root(config.root_path, home, existed)
}

pub fn init_library(app: &AppHandle) -> Result<LibraryInfo, String> {
    if let Some(result) = open_library_from_env(app) {
        return result;
    }
    ensure_default_library(app)
}

pub fn get_library_info(app: &AppHandle) -> Result<LibraryInfo, String> {
    let config = ensure_config_normalized(app)?;
    let home = resolve_home_path(app, &config)?;
    let project = read_project_manifest(&config.root_path)?;
    Ok(LibraryInfo {
        root_path: config.root_path.to_string_lossy().into_owned(),
        home_path: home.to_string_lossy().into_owned(),
        exists: config.root_path.exists(),
        project,
    })
}

fn is_root_level_markdown(library_root: &Path, path: &Path) -> bool {
    path.parent() == Some(library_root) && is_markdown_file(path)
}

fn relocate_library_recovery(app: &AppHandle, old_key: &str, new_key: &str) -> Result<(), String> {
    if old_key == new_key {
        return Ok(());
    }
    let old_path = library_recovery_path(app, old_key)?;
    if !old_path.exists() {
        return Ok(());
    }
    let new_path = library_recovery_path(app, new_key)?;
    if new_path.exists() {
        fs::remove_file(&new_path).map_err(|error| error.to_string())?;
    }
    fs::rename(&old_path, &new_path).map_err(|error| error.to_string())
}

/// Moves legacy `{root}/*.md` into `content/manuscripts/`, preserving recovery sidecars.
pub fn migrate_legacy_root_markdown(app: &AppHandle) -> Result<u32, String> {
    let config = read_config(app)?.ok_or("Library is not configured")?;
    let root = config.root_path;
    let _ = ensure_project_manifest(&root)?;
    let parent = manuscripts_dir(&root);
    fs::create_dir_all(&parent).map_err(|error| error.to_string())?;

    let entries = fs::read_dir(&root).map_err(|error| error.to_string())?;
    let mut paths = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        if is_root_level_markdown(&root, &path) {
            paths.push(path);
        }
    }

    let mut moved = 0u32;
    for path in paths {
        let title = title_from_path(&path);
        let (target, new_rel) = unique_manuscript_path(&root, &parent, &title)?;
        if path == target {
            continue;
        }
        fs::rename(&path, &target).map_err(|error| error.to_string())?;
        let old_rel = path
            .strip_prefix(&root)
            .map_err(|error| error.to_string())?
            .to_string_lossy()
            .into_owned();
        relocate_library_recovery(app, &old_rel, &new_rel)?;
        moved += 1;
    }
    Ok(moved)
}

pub fn set_library_root(app: &AppHandle, root_path: String) -> Result<LibraryInfo, String> {
    open_project_root(app, PathBuf::from(root_path))
}

pub fn open_project_root(app: &AppHandle, path: PathBuf) -> Result<LibraryInfo, String> {
    let mut config = ensure_config_normalized(app)?;
    config.root_path = path.clone();
    touch_recent_project(&mut config, &path);
    write_config(app, &config)?;
    let home = resolve_home_path(app, &config)?;
    library_info_for_root(path, home, true)
}

pub fn create_project_root(
    app: &AppHandle,
    parent_path: String,
    name: String,
) -> Result<LibraryInfo, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Project name is required".into());
    }
    if trimmed.contains('/') || trimmed.contains('\\') {
        return Err("Project name cannot contain path separators".into());
    }
    let config = ensure_config_normalized(app)?;
    let parent = if parent_path.trim().is_empty() {
        resolve_home_path(app, &config)?
    } else {
        PathBuf::from(parent_path)
    };
    fs::create_dir_all(&parent).map_err(|error| error.to_string())?;
    let root = unique_folder_path(&parent, trimmed);
    fs::create_dir_all(&root).map_err(|error| error.to_string())?;
    open_project_root(app, root)
}

pub fn list_projects(app: &AppHandle) -> Result<Vec<ProjectSummary>, String> {
    let config = ensure_config_normalized(app)?;
    let current_root = Some(config.root_path.clone());
    let home = resolve_home_path(app, &config)?;
    let mut entries: Vec<ProjectSummary> = Vec::new();
    let mut seen = std::collections::HashSet::new();

    for recent in config.recent_projects {
        let root = recent.root_path;
        if !seen.insert(root.clone()) {
            continue;
        }
        let title = if root.exists() {
            project_title_for_root(&root)
        } else {
            root.file_name()
                .and_then(|value| value.to_str())
                .unwrap_or("Missing project")
                .to_string()
        };
        let id = read_project_manifest(&root)
            .ok()
            .flatten()
            .map(|manifest| manifest.id);
        entries.push(ProjectSummary {
            root_path: root.to_string_lossy().into_owned(),
            title,
            id,
            last_opened_at: recent.last_opened_at,
            is_current: current_root.as_deref() == Some(root.as_path()),
        });
    }

    for root in discover_projects_in_home(&home) {
        if !seen.insert(root.clone()) {
            continue;
        }
        let title = project_title_for_root(&root);
        let id = read_project_manifest(&root)
            .ok()
            .flatten()
            .map(|manifest| manifest.id);
        entries.push(ProjectSummary {
            root_path: root.to_string_lossy().into_owned(),
            title,
            id,
            last_opened_at: Utc::now().to_rfc3339(),
            is_current: current_root.as_deref() == Some(root.as_path()),
        });
    }

    if let Some(current) = current_root.as_deref()
        && seen.insert(current.to_path_buf())
    {
        let title = project_title_for_root(current);
        let id = read_project_manifest(current)
            .ok()
            .flatten()
            .map(|manifest| manifest.id);
        entries.insert(
            0,
            ProjectSummary {
                root_path: current.to_string_lossy().into_owned(),
                title,
                id,
                last_opened_at: Utc::now().to_rfc3339(),
                is_current: true,
            },
        );
    }

    Ok(entries)
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
    is_manuscript_prose_file(path)
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

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectEntry {
    pub relative_path: String,
    pub name: String,
    /// `folder` or `file`
    pub kind: String,
    pub manuscript_id: Option<String>,
    pub updated_at: Option<String>,
}

fn should_skip_dir_entry(name: &str) -> bool {
    name.starts_with('.') || name == "node_modules"
}

fn resolve_explorer_parent(root: &Path, parent_relative: Option<&str>) -> Result<PathBuf, String> {
    match parent_relative.filter(|value| !value.is_empty()) {
        Some(rel) => {
            let path = resolve_library_path(root, rel)?;
            if path.is_file() {
                return path
                    .parent()
                    .map(|parent| parent.to_path_buf())
                    .ok_or_else(|| "Invalid parent folder".to_string());
            }
            Ok(path)
        }
        None => Ok(manuscripts_dir(root)),
    }
}

fn resolve_manuscript_parent(
    root: &Path,
    parent_relative: Option<&str>,
) -> Result<PathBuf, String> {
    match parent_relative.filter(|value| !value.is_empty()) {
        Some(rel) => resolve_explorer_parent(root, Some(rel)),
        None => Ok(manuscripts_dir(root)),
    }
}

fn unique_folder_path(parent: &Path, name: &str) -> PathBuf {
    let base = sanitize_title_for_filename(name);
    let mut candidate = parent.join(&base);
    if !candidate.exists() {
        return candidate;
    }
    let mut counter = 2;
    while candidate.exists() {
        candidate = parent.join(format!("{base} {counter}"));
        counter += 1;
    }
    candidate
}

fn walk_project_entries(
    root: &Path,
    dir: &Path,
    entries: &mut Vec<ProjectEntry>,
) -> Result<(), String> {
    for entry in fs::read_dir(dir).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().into_owned();
        if should_skip_dir_entry(&name) {
            continue;
        }
        let rel = path
            .strip_prefix(root)
            .map_err(|error| error.to_string())?
            .to_string_lossy()
            .into_owned();
        let file_type = entry.file_type().map_err(|error| error.to_string())?;
        if file_type.is_dir() {
            entries.push(ProjectEntry {
                relative_path: rel.clone(),
                name,
                kind: "folder".into(),
                manuscript_id: None,
                updated_at: None,
            });
            walk_project_entries(root, &path, entries)?;
            continue;
        }
        if !is_markdown_file(&path) {
            continue;
        }
        let (_created, modified) = file_created_modified(&path);
        entries.push(ProjectEntry {
            relative_path: rel.clone(),
            name,
            kind: "file".into(),
            manuscript_id: Some(manuscript_id_for_path(&rel)),
            updated_at: Some(modified),
        });
    }
    Ok(())
}

pub fn list_project_entries(app: &AppHandle) -> Result<Vec<ProjectEntry>, String> {
    let Some(config) = read_config(app)? else {
        return Ok(Vec::new());
    };
    if !config.root_path.exists() {
        return Ok(Vec::new());
    }
    let ms_root = manuscripts_dir(&config.root_path);
    if !ms_root.exists() {
        return Ok(Vec::new());
    }
    let mut entries = Vec::new();
    walk_project_entries(&config.root_path, &ms_root, &mut entries)?;
    entries.sort_by(|a, b| match (a.kind.as_str(), b.kind.as_str()) {
        ("folder", "file") => std::cmp::Ordering::Less,
        ("file", "folder") => std::cmp::Ordering::Greater,
        _ => a.relative_path.cmp(&b.relative_path),
    });
    Ok(entries)
}

pub fn create_project_folder(
    app: &AppHandle,
    parent_relative: Option<String>,
    folder_name: String,
) -> Result<ProjectEntry, String> {
    let trimmed = folder_name.trim();
    if trimmed.is_empty() {
        return Err("Folder name is required".into());
    }
    if trimmed.contains('/') || trimmed.contains('\\') {
        return Err("Folder name cannot contain path separators".into());
    }
    let config = read_config(app)?.ok_or("Library is not configured")?;
    let parent = resolve_explorer_parent(&config.root_path, parent_relative.as_deref())?;
    fs::create_dir_all(&parent).map_err(|error| error.to_string())?;
    let folder_path = unique_folder_path(&parent, trimmed);
    fs::create_dir_all(&folder_path).map_err(|error| error.to_string())?;
    let rel = folder_path
        .strip_prefix(&config.root_path)
        .map_err(|error| error.to_string())?
        .to_string_lossy()
        .into_owned();
    let name = folder_path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or(trimmed)
        .to_string();
    Ok(ProjectEntry {
        relative_path: rel,
        name,
        kind: "folder".into(),
        manuscript_id: None,
        updated_at: None,
    })
}

fn walk_markdown_files(
    root: &Path,
    dir: &Path,
    entries: &mut Vec<(PathBuf, String)>,
) -> Result<(), String> {
    for entry in fs::read_dir(dir).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        if path.file_name().is_some_and(|name| {
            name == ".scribo" || name == ".git" || name.to_str().is_some_and(|n| n.starts_with('.'))
        }) {
            continue;
        }
        let file_type = entry.file_type().map_err(|error| error.to_string())?;
        if file_type.is_dir() {
            if path
                .file_name()
                .is_some_and(|name| name == ".scribo" || name == ".git")
            {
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

    let ms_root = manuscripts_dir(&config.root_path);
    if !ms_root.exists() {
        return Ok(Vec::new());
    }
    let mut files = Vec::new();
    walk_markdown_files(&config.root_path, &ms_root, &mut files)?;

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
    assert_prosa_manuscript_absolute(&config.root_path, &path)?;
    if !path.exists() {
        return Err("File not found".into());
    }
    fs::read_to_string(path).map_err(|error| error.to_string())
}

fn is_forbidden_filename_char(ch: char) -> bool {
    matches!(ch, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|') || ch.is_control()
}

fn strip_markdown_extension(title: &str) -> String {
    let trimmed = title.trim();
    if trimmed.len() >= 10 && trimmed.to_ascii_lowercase().ends_with(".markdown") {
        return trimmed[..trimmed.len() - 10].trim_end().to_string();
    }
    if trimmed.len() >= 3 && trimmed.to_ascii_lowercase().ends_with(".md") {
        return trimmed[..trimmed.len() - 3].trim_end().to_string();
    }
    if trimmed.len() >= 8 && trimmed.to_ascii_lowercase().ends_with(".mdprosa") {
        return trimmed[..trimmed.len() - 8].trim_end().to_string();
    }
    trimmed.to_string()
}

/// Filesystem-safe stem: keep punctuation such as `(Draft)`; strip path separators only.
fn sanitize_title_for_filename(title: &str) -> String {
    let title = strip_markdown_extension(title);
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

/// Pick `{sanitized title}.mdprosa` in `parent` (migrates off `.md` on rename/save).
fn sibling_markdown_path(parent: &Path, title: &str, current: &Path) -> PathBuf {
    let base_name = sanitize_title_for_filename(title);
    let ext = MANUSCRIPT_PROSE_EXTENSION;
    let mut candidate = parent.join(format!("{base_name}.{ext}"));
    if candidate == current {
        return candidate;
    }
    let mut counter = 2;
    while candidate.exists() && candidate != current {
        candidate = parent.join(format!("{base_name} {counter}.{ext}"));
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
    assert_prosa_manuscript_absolute(&config.root_path, &current_path)?;
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
    let config = read_config(app)?.ok_or("Library is not configured")?;
    assert_prosa_manuscript_absolute(&config.root_path, &path)?;
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

/// Wipe crash-recovery sidecars after Git checkout so editors reload branch files from disk.
pub fn clear_all_library_recovery_at_root(root: &Path) -> Result<(), String> {
    let dir = root.join(".scribo/recovery");
    if !dir.exists() {
        return Ok(());
    }
    for entry in fs::read_dir(&dir).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        if path.is_file() {
            fs::remove_file(&path).map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

fn unique_manuscript_path(
    library_root: &Path,
    parent: &Path,
    title: &str,
) -> Result<(PathBuf, String), String> {
    let base_name = sanitize_title_for_filename(title);

    let ext = MANUSCRIPT_PROSE_EXTENSION;
    let mut candidate = parent.join(format!("{base_name}.{ext}"));
    let mut counter = 2;
    while candidate.exists() {
        candidate = parent.join(format!("{base_name} {counter}.{ext}"));
        counter += 1;
    }

    let rel = candidate
        .strip_prefix(library_root)
        .map_err(|error| error.to_string())?
        .to_string_lossy()
        .into_owned();
    Ok((candidate, rel))
}

pub fn create_library_markdown_with_content(
    app: &AppHandle,
    title: String,
    markdown: String,
) -> Result<(ManuscriptSummary, String), String> {
    create_library_markdown_in_parent(app, None, title, markdown)
}

pub fn create_library_markdown_in_parent(
    app: &AppHandle,
    parent_relative: Option<String>,
    title: String,
    markdown: String,
) -> Result<(ManuscriptSummary, String), String> {
    let config = read_config(app)?.ok_or("Library is not configured")?;
    let parent = resolve_manuscript_parent(&config.root_path, parent_relative.as_deref())?;
    fs::create_dir_all(&parent).map_err(|error| error.to_string())?;

    let (path, rel) = unique_manuscript_path(&config.root_path, &parent, &title)?;
    assert_prosa_manuscript_absolute(&config.root_path, &path)?;
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
    fn sanitize_title_for_filename_strips_markdown_extension() {
        assert_eq!(sanitize_title_for_filename("Chapter One.md"), "Chapter One");
        assert_eq!(sanitize_title_for_filename("draft.markdown"), "draft");
    }

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
    fn migrate_embedded_project_from_home_moves_manifest_and_content() {
        let home =
            std::env::temp_dir().join(format!("scribo-home-migrate-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&home).unwrap();
        ensure_project_manifest(&home).unwrap();
        fs::create_dir_all(home.join("content/manuscripts")).unwrap();
        fs::write(home.join("content/manuscripts/intro.md"), "# hi").unwrap();
        fs::write(home.join("orphan-at-root.md"), "# root").unwrap();

        let dest = migrate_embedded_project_from_home(&home).unwrap();
        assert!(dest.starts_with(&home));
        assert!(dest.join("scribo.project.json").is_file());
        assert!(dest.join("content/manuscripts/intro.md").is_file());
        assert!(dest.join("orphan-at-root.md").is_file());
        assert!(!home.join("scribo.project.json").exists());
        assert!(!home.join("content").exists());

        fs::remove_dir_all(&home).ok();
    }

    #[test]
    fn sibling_markdown_path_renames_without_collision() {
        let dir = std::env::temp_dir().join(format!("scribo-lib-test-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&dir).unwrap();
        let current = dir.join("Old Name.md");
        fs::write(&current, "# old").unwrap();

        let next = sibling_markdown_path(&dir, "New Name", &current);
        assert_eq!(next, dir.join("New Name.mdprosa"));

        fs::remove_dir_all(&dir).ok();
    }
}
