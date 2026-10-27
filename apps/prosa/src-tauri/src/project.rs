use std::fs;
use std::path::{Path, PathBuf};

use chrono::Utc;
use serde::{Deserialize, Serialize};

use crate::app_paths::{LEGACY_PROJECT_MANIFEST_FILE, recovery_dir};
use crate::atomic_io::atomic_write;

pub const PROJECT_MANIFEST_FILE: &str = "scribam.project.json";
const PROJECT_SCHEMA_VERSION: u32 = 1;
pub const PROJECT_LAYOUT_VERSION: u32 = 2;
const PROJECT_ID_PREFIX: &str = "proj_";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppPathOperations {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub read: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub write: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub create_delete: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppCapabilityDeclaration {
    pub app_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub allowed_operations: Option<AppPathOperations>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ProjectAppsBlock {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub prosa: Option<AppCapabilityDeclaration>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub folia: Option<AppCapabilityDeclaration>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub drama: Option<AppCapabilityDeclaration>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScribamProjectManifest {
    pub project_schema_version: u32,
    pub id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub layout_version: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub apps: Option<ProjectAppsBlock>,
}

fn new_project_id() -> String {
    format!("{PROJECT_ID_PREFIX}{}", uuid::Uuid::new_v4())
}

fn default_title_from_root(root: &Path) -> String {
    root.file_name()
        .and_then(|name| name.to_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("Scribam project")
        .to_string()
}

pub fn manuscripts_dir(root: &Path) -> PathBuf {
    crate::project_layout::resolve_manuscripts_dir(root)
}

const WORKSPACE_TASKS_FILE: &str = "workspace/tasks.json";

fn ensure_workspace_stub(root: &Path) -> Result<(), String> {
    let path = root.join(WORKSPACE_TASKS_FILE);
    if path.exists() {
        return Ok(());
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let stub = serde_json::json!({
        "schemaVersion": 1,
        "tasks": []
    });
    atomic_write(
        &path,
        &serde_json::to_string_pretty(&stub).map_err(|e| e.to_string())?,
    )
}

fn write_manifest(root: &Path, manifest: &ScribamProjectManifest) -> Result<(), String> {
    let path = root.join(PROJECT_MANIFEST_FILE);
    let raw = serde_json::to_string_pretty(manifest).map_err(|error| error.to_string())?;
    atomic_write(&path, &raw)
}

fn default_project_apps() -> ProjectAppsBlock {
    ProjectAppsBlock {
        prosa: Some(AppCapabilityDeclaration {
            app_id: "com.scribam.prosa".into(),
            allowed_operations: Some(AppPathOperations {
                read: Some(vec![
                    "content/manuscripts".into(),
                    "contents/canon/manuscripts".into(),
                    "contents/shared".into(),
                    "scribam.project.json".into(),
                ]),
                write: Some(vec![
                    "content/manuscripts".into(),
                    "contents/canon/manuscripts".into(),
                ]),
                create_delete: Some(vec![
                    "content/manuscripts".into(),
                    "contents/canon/manuscripts".into(),
                ]),
            }),
        }),
        folia: Some(AppCapabilityDeclaration {
            app_id: "com.scribam.folia".into(),
            allowed_operations: Some(AppPathOperations {
                read: Some(vec![
                    "contents/canon/folia".into(),
                    "contents/shared".into(),
                    "scribam.project.json".into(),
                ]),
                write: Some(vec!["contents/canon/folia".into()]),
                create_delete: Some(vec!["contents/canon/folia".into()]),
            }),
        }),
        drama: Some(AppCapabilityDeclaration {
            app_id: "com.scribam.drama".into(),
            allowed_operations: Some(AppPathOperations {
                read: Some(vec![
                    "contents/canon/drama".into(),
                    "contents/shared".into(),
                    "scribam.project.json".into(),
                ]),
                write: Some(vec!["contents/canon/drama".into()]),
                create_delete: Some(vec!["contents/canon/drama".into()]),
            }),
        }),
    }
}

fn new_manifest(root: &Path) -> ScribamProjectManifest {
    let now = Utc::now().to_rfc3339();
    ScribamProjectManifest {
        project_schema_version: PROJECT_SCHEMA_VERSION,
        id: new_project_id(),
        title: default_title_from_root(root),
        created_at: now.clone(),
        updated_at: now,
        layout_version: 0,
        apps: Some(default_project_apps()),
    }
}

/// Creates `.scribam/recovery` and manuscript trees; bumps `layoutVersion` when needed.
pub fn ensure_project_layout(
    root: &Path,
    manifest: &mut ScribamProjectManifest,
) -> Result<bool, String> {
    fs::create_dir_all(recovery_dir(root)).map_err(|error| error.to_string())?;
    ensure_workspace_stub(root)?;
    ensure_multi_app_canon_dirs(root)?;

    if manifest.layout_version >= PROJECT_LAYOUT_VERSION {
        if manifest.layout_version >= 2 {
            crate::project_layout::ensure_v2_manuscripts_dir(root)?;
        } else {
            crate::project_layout::ensure_v1_manuscripts_dir(root)?;
        }
        return Ok(false);
    }

    if manifest.layout_version == 0 {
        crate::project_layout::ensure_v2_manuscripts_dir(root)?;
        manifest.layout_version = PROJECT_LAYOUT_VERSION;
        return Ok(true);
    }

    if manifest.layout_version == 1 {
        crate::project_layout::ensure_v1_manuscripts_dir(root)?;
        return Ok(false);
    }

    crate::project_layout::ensure_v2_manuscripts_dir(root)?;
    manifest.layout_version = PROJECT_LAYOUT_VERSION;
    Ok(true)
}

fn ensure_multi_app_canon_dirs(root: &Path) -> Result<(), String> {
    let _ = fs::create_dir_all(root.join("contents/canon/folia"));
    let _ = fs::create_dir_all(root.join("contents/canon/drama"));
    let _ = fs::create_dir_all(root.join("contents/shared/research"));
    let _ = fs::create_dir_all(root.join("contents/shared/assets"));
    Ok(())
}

pub fn apply_post_open_layout_migrations(root: &Path) -> Result<(), String> {
    if crate::project_layout::migrate_manuscripts_tree_v1_to_v2(root)?
        && let Some(mut manifest) = read_project_manifest(root)?
        && manifest.layout_version < PROJECT_LAYOUT_VERSION
    {
        manifest.layout_version = PROJECT_LAYOUT_VERSION;
        manifest.updated_at = Utc::now().to_rfc3339();
        write_manifest(root, &manifest)?;
    }
    Ok(())
}

pub fn read_project_manifest(root: &Path) -> Result<Option<ScribamProjectManifest>, String> {
    let path = root.join(PROJECT_MANIFEST_FILE);
    let legacy = root.join(LEGACY_PROJECT_MANIFEST_FILE);
    let read_path = if path.exists() {
        path
    } else if legacy.exists() {
        legacy
    } else {
        return Ok(None);
    };
    let raw = fs::read_to_string(&read_path).map_err(|error| error.to_string())?;
    serde_json::from_str(&raw).map_err(|error| error.to_string())
}

pub fn update_project_title(root: &Path, title: &str) -> Result<ScribamProjectManifest, String> {
    let trimmed = title.trim();
    if trimmed.is_empty() {
        return Err("Project title is required".into());
    }
    let mut manifest = read_project_manifest(root)?.ok_or("Not a project folder")?;
    manifest.title = trimmed.to_string();
    manifest.updated_at = Utc::now().to_rfc3339();
    write_manifest(root, &manifest)?;
    Ok(manifest)
}

pub fn ensure_project_manifest(root: &Path) -> Result<ScribamProjectManifest, String> {
    let manifest_path = root.join(PROJECT_MANIFEST_FILE);
    let is_new = !manifest_path.exists();
    let mut manifest = read_project_manifest(root)?.unwrap_or_else(|| new_manifest(root));

    let layout_changed = ensure_project_layout(root, &mut manifest)?;
    if is_new || layout_changed {
        manifest.updated_at = Utc::now().to_rfc3339();
        write_manifest(root, &manifest)?;
    }

    Ok(manifest)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::app_paths::APP_LOCAL_DIR;

    #[test]
    fn ensure_project_manifest_creates_layout_dirs() {
        let root = std::env::temp_dir().join(format!("scribam-proj-test-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&root).unwrap();

        let manifest = ensure_project_manifest(&root).unwrap();
        assert_eq!(manifest.layout_version, PROJECT_LAYOUT_VERSION);
        assert!(root.join(PROJECT_MANIFEST_FILE).exists());
        assert!(manuscripts_dir(&root).is_dir());
        assert!(root.join(APP_LOCAL_DIR).join("recovery").is_dir());
        assert!(manifest.apps.is_some());

        fs::remove_dir_all(&root).ok();
    }

    #[test]
    fn ensure_project_manifest_upgrades_legacy_layout_version() {
        let root = std::env::temp_dir().join(format!("scribam-proj-test-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&root).unwrap();
        let legacy = ScribamProjectManifest {
            project_schema_version: 1,
            id: "proj_legacy".into(),
            title: "Legacy".into(),
            created_at: Utc::now().to_rfc3339(),
            updated_at: Utc::now().to_rfc3339(),
            layout_version: 0,
            apps: None,
        };
        write_manifest(&root, &legacy).unwrap();

        let manifest = ensure_project_manifest(&root).unwrap();
        assert_eq!(manifest.layout_version, PROJECT_LAYOUT_VERSION);
        assert!(manuscripts_dir(&root).is_dir());

        fs::remove_dir_all(&root).ok();
    }
}
