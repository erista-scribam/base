use std::fs;
use std::path::{Path, PathBuf};

use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::Manager;

const HOME_DIR_NAME: &str = "Scribo Prosa";
const MANIFEST_FILE: &str = "scribo.project.json";
const CONFIG_FILE: &str = "lanista.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LanistaConfig {
    home_path: PathBuf,
    #[serde(default)]
    recent_projects: Vec<PathBuf>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProjectManifest {
    #[serde(default)]
    project_schema_version: u32,
    id: String,
    title: String,
    created_at: String,
    updated_at: String,
    #[serde(default)]
    layout_version: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    apps: Option<serde_json::Value>,
}

fn default_project_apps_json() -> serde_json::Value {
    serde_json::json!({
        "prosa": {
            "appId": "com.scribo.prosa",
            "allowedOperations": {
                "read": [
                    "content/manuscripts",
                    "contents/canon/manuscripts",
                    "contents/shared",
                    "scribo.project.json"
                ],
                "write": ["content/manuscripts", "contents/canon/manuscripts"],
                "createDelete": ["content/manuscripts", "contents/canon/manuscripts"]
            }
        },
        "folia": {
            "appId": "com.scribo.folia",
            "allowedOperations": {
                "read": ["contents/canon/folia", "contents/shared", "scribo.project.json"],
                "write": ["contents/canon/folia"],
                "createDelete": ["contents/canon/folia"]
            }
        },
        "drama": {
            "appId": "com.scribo.drama",
            "allowedOperations": {
                "read": ["contents/canon/drama", "contents/shared", "scribo.project.json"],
                "write": ["contents/canon/drama"],
                "createDelete": ["contents/canon/drama"]
            }
        }
    })
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanistaProject {
    pub root_path: String,
    pub title: String,
    pub id: Option<String>,
}

fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?
        .join(CONFIG_FILE))
}

fn read_config(app: &AppHandle) -> Result<LanistaConfig, String> {
    let path = config_path(app)?;
    if path.exists() {
        let raw = fs::read_to_string(path).map_err(|error| error.to_string())?;
        return serde_json::from_str(&raw).map_err(|error| error.to_string());
    }
    let docs = app
        .path()
        .document_dir()
        .map_err(|error| error.to_string())?;
    let home = docs.join(HOME_DIR_NAME);
    fs::create_dir_all(&home).map_err(|error| error.to_string())?;
    let config = LanistaConfig {
        home_path: home,
        recent_projects: Vec::new(),
    };
    write_config(app, &config)?;
    Ok(config)
}

fn write_config(app: &AppHandle, config: &LanistaConfig) -> Result<(), String> {
    let path = config_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let raw = serde_json::to_string_pretty(config).map_err(|error| error.to_string())?;
    fs::write(path, raw).map_err(|error| error.to_string())
}

fn touch_recent(config: &mut LanistaConfig, root: &Path) {
    config.recent_projects.retain(|entry| entry != root);
    config.recent_projects.insert(0, root.to_path_buf());
    config.recent_projects.truncate(24);
}

fn is_project_dir(path: &Path) -> bool {
    path.join(MANIFEST_FILE).is_file()
}

fn read_manifest_title(root: &Path) -> String {
    let path = root.join(MANIFEST_FILE);
    if let Ok(raw) = fs::read_to_string(path)
        && let Ok(manifest) = serde_json::from_str::<ProjectManifest>(&raw)
    {
        return manifest.title;
    }
    root.file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("Untitled project")
        .to_string()
}

fn discover_in_home(home: &Path) -> Vec<PathBuf> {
    let mut paths = Vec::new();
    let entries = match fs::read_dir(home) {
        Ok(entries) => entries,
        Err(_) => return paths,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() && is_project_dir(&path) {
            paths.push(path);
        }
    }
    paths.sort_by(|a, b| a.file_name().cmp(&b.file_name()));
    paths
}

fn ensure_project_layout(root: &Path, title: &str) -> Result<(), String> {
    fs::create_dir_all(root.join("contents/canon/manuscripts"))
        .map_err(|error| error.to_string())?;
    let _ = fs::create_dir_all(root.join("contents/canon/folia"));
    let _ = fs::create_dir_all(root.join("contents/canon/drama"));
    let _ = fs::create_dir_all(root.join("contents/shared/research"));
    let _ = fs::create_dir_all(root.join("contents/shared/assets"));
    fs::create_dir_all(root.join(".scribo/recovery")).map_err(|error| error.to_string())?;
    let manifest_path = root.join(MANIFEST_FILE);
    if manifest_path.exists() {
        return Ok(());
    }
    let now = Utc::now().to_rfc3339();
    let manifest = ProjectManifest {
        project_schema_version: 1,
        id: format!("proj_{}", uuid::Uuid::new_v4()),
        title: title.to_string(),
        created_at: now.clone(),
        updated_at: now,
        layout_version: 2,
        apps: Some(default_project_apps_json()),
    };
    let raw = serde_json::to_string_pretty(&manifest).map_err(|error| error.to_string())?;
    fs::write(manifest_path, raw).map_err(|error| error.to_string())
}

fn unique_project_dir(home: &Path, name: &str) -> PathBuf {
    let base = name.trim();
    let mut candidate = home.join(base);
    if !candidate.exists() {
        return candidate;
    }
    let mut counter = 2;
    while candidate.exists() {
        candidate = home.join(format!("{base} {counter}"));
        counter += 1;
    }
    candidate
}

pub fn home_path(app: &AppHandle) -> Result<String, String> {
    let config = read_config(app)?;
    Ok(config.home_path.to_string_lossy().into_owned())
}

pub fn list_projects(app: &AppHandle) -> Result<Vec<LanistaProject>, String> {
    let config = read_config(app)?;
    let home = config.home_path.clone();
    let mut seen = std::collections::HashSet::new();
    let mut out = Vec::new();

    for recent in &config.recent_projects {
        if !seen.insert(recent.clone()) {
            continue;
        }
        let title = if recent.exists() {
            read_manifest_title(recent)
        } else {
            recent
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or("Missing project")
                .to_string()
        };
        let id = if recent.exists() {
            fs::read_to_string(recent.join(MANIFEST_FILE))
                .ok()
                .and_then(|raw| serde_json::from_str::<ProjectManifest>(&raw).ok())
                .map(|manifest| manifest.id)
        } else {
            None
        };
        out.push(LanistaProject {
            root_path: recent.to_string_lossy().into_owned(),
            title,
            id,
        });
    }

    for path in discover_in_home(&home) {
        if !seen.insert(path.clone()) {
            continue;
        }
        let id = fs::read_to_string(path.join(MANIFEST_FILE))
            .ok()
            .and_then(|raw| serde_json::from_str::<ProjectManifest>(&raw).ok())
            .map(|manifest| manifest.id);
        out.push(LanistaProject {
            root_path: path.to_string_lossy().into_owned(),
            title: read_manifest_title(&path),
            id,
        });
    }

    Ok(out)
}

pub fn create_project(app: &AppHandle, name: String) -> Result<LanistaProject, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Project name is required".into());
    }
    if trimmed.contains('/') || trimmed.contains('\\') {
        return Err("Project name cannot contain path separators".into());
    }
    let mut config = read_config(app)?;
    let root = unique_project_dir(&config.home_path, trimmed);
    fs::create_dir_all(&root).map_err(|error| error.to_string())?;
    ensure_project_layout(&root, trimmed)?;
    touch_recent(&mut config, &root);
    write_config(app, &config)?;
    let id = fs::read_to_string(root.join(MANIFEST_FILE))
        .ok()
        .and_then(|raw| serde_json::from_str::<ProjectManifest>(&raw).ok())
        .map(|manifest| manifest.id);
    Ok(LanistaProject {
        root_path: root.to_string_lossy().into_owned(),
        title: read_manifest_title(&root),
        id,
    })
}
