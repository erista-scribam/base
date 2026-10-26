use std::fs;
use std::path::Path;

use chrono::Utc;
use serde::{Deserialize, Serialize};

use crate::atomic_io::atomic_write;

pub const PROJECT_MANIFEST_FILE: &str = "scribo.project.json";
const PROJECT_SCHEMA_VERSION: u32 = 1;
const PROJECT_ID_PREFIX: &str = "proj_";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScriboProjectManifest {
    pub project_schema_version: u32,
    pub id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
}

fn new_project_id() -> String {
    format!("{PROJECT_ID_PREFIX}{}", uuid::Uuid::new_v4())
}

fn default_title_from_root(root: &Path) -> String {
    root.file_name()
        .and_then(|name| name.to_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("Scribo project")
        .to_string()
}

pub fn read_project_manifest(root: &Path) -> Result<Option<ScriboProjectManifest>, String> {
    let path = root.join(PROJECT_MANIFEST_FILE);
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    serde_json::from_str(&raw).map_err(|error| error.to_string())
}

pub fn ensure_project_manifest(root: &Path) -> Result<ScriboProjectManifest, String> {
    if let Some(existing) = read_project_manifest(root)? {
        return Ok(existing);
    }

    let now = Utc::now().to_rfc3339();
    let manifest = ScriboProjectManifest {
        project_schema_version: PROJECT_SCHEMA_VERSION,
        id: new_project_id(),
        title: default_title_from_root(root),
        created_at: now.clone(),
        updated_at: now,
    };
    let path = root.join(PROJECT_MANIFEST_FILE);
    let raw = serde_json::to_string_pretty(&manifest).map_err(|error| error.to_string())?;
    atomic_write(&path, &raw)?;
    Ok(manifest)
}
