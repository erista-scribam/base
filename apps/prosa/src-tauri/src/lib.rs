mod persistence;

use persistence::{
    create_manuscript as create_manuscript_impl, list_manuscripts as list_manuscripts_impl,
    load_manuscript as load_manuscript_impl, load_recovery_snapshot as load_recovery_snapshot_impl,
    save_manuscript as save_manuscript_impl, save_recovery_snapshot as save_recovery_snapshot_impl,
    ManuscriptSummary,
};
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LoadedManuscript {
    summary: ManuscriptSummary,
    document_json: String,
}

#[tauri::command]
fn list_manuscripts(app: tauri::AppHandle) -> Result<Vec<ManuscriptSummary>, String> {
    list_manuscripts_impl(app)
}

#[tauri::command]
fn create_manuscript(
    app: tauri::AppHandle,
    title: String,
    document_json: String,
) -> Result<LoadedManuscript, String> {
    let (summary, document_json) = create_manuscript_impl(app, title, document_json)?;
    Ok(LoadedManuscript {
        summary,
        document_json,
    })
}

#[tauri::command]
fn load_manuscript(app: tauri::AppHandle, id: String) -> Result<LoadedManuscript, String> {
    let (summary, document_json) = load_manuscript_impl(app, id)?;
    Ok(LoadedManuscript {
        summary,
        document_json,
    })
}

#[tauri::command]
fn save_manuscript(
    app: tauri::AppHandle,
    id: String,
    document_json: String,
) -> Result<ManuscriptSummary, String> {
    save_manuscript_impl(app, id, document_json)
}

#[tauri::command]
fn save_recovery_snapshot(
    app: tauri::AppHandle,
    id: String,
    document_json: String,
) -> Result<(), String> {
    save_recovery_snapshot_impl(app, id, document_json)
}

#[tauri::command]
fn load_recovery_snapshot(
    app: tauri::AppHandle,
    id: String,
) -> Result<Option<String>, String> {
    load_recovery_snapshot_impl(app, id)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_manuscripts,
            create_manuscript,
            load_manuscript,
            save_manuscript,
            save_recovery_snapshot,
            load_recovery_snapshot
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
