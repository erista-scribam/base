use std::fs;
use std::path::{Path, PathBuf};

use crate::atomic_io::atomic_write;
use crate::recovery::{parse_recovery, wrap_recovery};

use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManuscriptSummary {
    pub id: String,
    pub title: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ManuscriptMeta {
    id: String,
    title: String,
    document_id: String,
    created_at: String,
    updated_at: String,
}

fn manuscripts_root(app: &AppHandle) -> Result<PathBuf, String> {
    let root = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("manuscripts");
    fs::create_dir_all(&root).map_err(|error| error.to_string())?;
    Ok(root)
}

pub fn manuscript_dir(app: &AppHandle, id: &str) -> Result<PathBuf, String> {
    Ok(manuscripts_root(app)?.join(id))
}

fn read_meta(path: &Path) -> Result<ManuscriptMeta, String> {
    let raw = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&raw).map_err(|error| error.to_string())
}

fn write_meta(path: &Path, meta: &ManuscriptMeta) -> Result<(), String> {
    let raw = serde_json::to_string_pretty(meta).map_err(|error| error.to_string())?;
    atomic_write(path, &raw)
}

fn validate_document_json(document_json: &str) -> Result<(), String> {
    let value: serde_json::Value =
        serde_json::from_str(document_json).map_err(|error| format!("Invalid document JSON: {error}"))?;
    if !value.get("schemaVersion").is_some() || !value.get("blocks").is_some() {
        return Err("Document JSON is missing required fields".into());
    }
    Ok(())
}

pub fn list_manuscripts(app: AppHandle) -> Result<Vec<ManuscriptSummary>, String> {
    let root = manuscripts_root(&app)?;
    let mut summaries = Vec::new();

    for entry in fs::read_dir(root).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        if !entry
            .file_type()
            .map_err(|error| error.to_string())?
            .is_dir()
        {
            continue;
        }
        let meta_path = entry.path().join("meta.json");
        if !meta_path.exists() {
            continue;
        }
        let meta = read_meta(&meta_path)?;
        summaries.push(ManuscriptSummary {
            id: meta.id,
            title: meta.title,
            updated_at: meta.updated_at,
            file_path: None,
            source: Some("internal".into()),
        });
    }

    summaries.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(summaries)
}

pub fn create_manuscript(
    app: AppHandle,
    title: String,
    document_json: String,
) -> Result<(ManuscriptSummary, String), String> {
    let id = format!("ms_{}", uuid::Uuid::new_v4());
    let parsed: serde_json::Value =
        serde_json::from_str(&document_json).map_err(|error| error.to_string())?;
    let document_id = parsed
        .get("id")
        .and_then(|value| value.as_str())
        .unwrap_or("doc_unknown")
        .to_string();
    let now = Utc::now().to_rfc3339();
    let dir = manuscript_dir(&app, &id)?;
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;

    let meta = ManuscriptMeta {
        id: id.clone(),
        title: title.clone(),
        document_id,
        created_at: now.clone(),
        updated_at: now.clone(),
    };

    validate_document_json(&document_json)?;
    write_meta(&dir.join("meta.json"), &meta)?;
    atomic_write(&dir.join("document.json"), &document_json)?;

    Ok((
        ManuscriptSummary {
            id,
            title,
            updated_at: meta.updated_at,
            file_path: None,
            source: Some("internal".into()),
        },
        document_json,
    ))
}

pub fn load_manuscript(app: AppHandle, id: String) -> Result<(ManuscriptSummary, String), String> {
    let dir = manuscript_dir(&app, &id)?;
    let meta = read_meta(&dir.join("meta.json"))?;
    let document_json =
        fs::read_to_string(dir.join("document.json")).map_err(|error| error.to_string())?;
    Ok((
        ManuscriptSummary {
            id: meta.id,
            title: meta.title,
            updated_at: meta.updated_at,
            file_path: None,
            source: Some("internal".into()),
        },
        document_json,
    ))
}

pub fn save_manuscript(
    app: AppHandle,
    id: String,
    document_json: String,
) -> Result<ManuscriptSummary, String> {
    let dir = manuscript_dir(&app, &id)?;
    let meta_path = dir.join("meta.json");
    let mut meta = read_meta(&meta_path)?;

    if let Ok(value) = serde_json::from_str::<serde_json::Value>(&document_json)
        && let Some(title) = value.get("title").and_then(|t| t.as_str())
    {
        meta.title = title.to_string();
    }

    validate_document_json(&document_json)?;
    meta.updated_at = Utc::now().to_rfc3339();
    write_meta(&meta_path, &meta)?;
    atomic_write(&dir.join("document.json"), &document_json)?;

    Ok(ManuscriptSummary {
        id: meta.id,
        title: meta.title,
        updated_at: meta.updated_at,
        file_path: None,
        source: Some("internal".into()),
    })
}

pub fn save_recovery_snapshot(
    app: AppHandle,
    id: String,
    document_json: String,
) -> Result<(), String> {
    let dir = manuscript_dir(&app, &id)?;
    atomic_write(&dir.join("recovery.json"), &wrap_recovery(document_json))
}

pub fn load_recovery_snapshot(app: AppHandle, id: String) -> Result<Option<crate::recovery::RecoveryPayload>, String> {
    let path = manuscript_dir(&app, &id)?.join("recovery.json");
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(path).map_err(|error| error.to_string())?;
    Ok(Some(parse_recovery(&raw)))
}
