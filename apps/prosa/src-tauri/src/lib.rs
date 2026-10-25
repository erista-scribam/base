mod library;
mod persistence;

use library::{
    absolute_path_for_entry, create_library_markdown, ensure_default_library, get_library_info,
    import_external_markdown, is_library_manuscript_id, list_library_manuscripts,
    path_key_for_manuscript_id, read_library_markdown, set_library_root, write_library_markdown,
    LibraryInfo,
};
use persistence::{
    ManuscriptSummary, create_manuscript as create_manuscript_impl,
    list_manuscripts as list_internal_manuscripts, load_manuscript as load_internal_manuscript,
    load_recovery_snapshot as load_recovery_snapshot_impl, save_manuscript as save_internal_manuscript,
    save_recovery_snapshot as save_recovery_snapshot_impl,
};
use serde::Serialize;
use std::process::Command;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LoadedManuscript {
    summary: ManuscriptSummary,
    #[serde(skip_serializing_if = "Option::is_none")]
    document_json: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    markdown: Option<String>,
}

fn merge_manuscript_lists(
    library: Vec<ManuscriptSummary>,
    internal: Vec<ManuscriptSummary>,
) -> Vec<ManuscriptSummary> {
    let mut merged = library;
    merged.extend(internal);
    merged.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    merged
}

#[tauri::command]
fn list_manuscripts(app: tauri::AppHandle) -> Result<Vec<ManuscriptSummary>, String> {
    let library = list_library_manuscripts(&app).unwrap_or_default();
    let internal = list_internal_manuscripts(app)?;
    Ok(merge_manuscript_lists(library, internal))
}

#[tauri::command]
fn get_library(app: tauri::AppHandle) -> Result<LibraryInfo, String> {
    get_library_info(&app)
}

#[tauri::command]
fn init_library(app: tauri::AppHandle) -> Result<LibraryInfo, String> {
    ensure_default_library(&app)
}

#[tauri::command]
fn set_library(app: tauri::AppHandle, root_path: String) -> Result<LibraryInfo, String> {
    set_library_root(&app, root_path)
}

#[tauri::command]
fn create_manuscript(
    app: tauri::AppHandle,
    title: String,
    document_json: String,
) -> Result<LoadedManuscript, String> {
    let _ = ensure_default_library(&app);
    if let Ok((summary, markdown)) = create_library_markdown(&app, title.clone()) {
        return Ok(LoadedManuscript {
            summary,
            document_json: None,
            markdown: Some(markdown),
        });
    }

    let (summary, document_json) = create_manuscript_impl(app, title, document_json)?;
    Ok(LoadedManuscript {
        summary,
        document_json: Some(document_json),
        markdown: None,
    })
}

#[tauri::command]
fn load_manuscript(app: tauri::AppHandle, id: String) -> Result<LoadedManuscript, String> {
    if is_library_manuscript_id(&id) {
        let path_key = path_key_for_manuscript_id(&id).ok_or("Invalid library manuscript id")?;
        let markdown = read_library_markdown(&app, path_key.clone())?;
        let summaries = list_library_manuscripts(&app)?;
        if let Some(summary) = summaries.into_iter().find(|item| item.id == id) {
            return Ok(LoadedManuscript {
                summary,
                document_json: None,
                markdown: Some(markdown),
            });
        }
        let path = absolute_path_for_entry(&app, &path_key)?;
        let summary = ManuscriptSummary {
            id: id.clone(),
            title: path
                .file_stem()
                .and_then(|stem| stem.to_str())
                .unwrap_or("Untitled")
                .to_string(),
            updated_at: chrono::Utc::now().to_rfc3339(),
            file_path: Some(path_key),
            source: Some("library".into()),
        };
        return Ok(LoadedManuscript {
            summary,
            document_json: None,
            markdown: Some(markdown),
        });
    }

    let (summary, document_json) = load_internal_manuscript(app, id)?;
    Ok(LoadedManuscript {
        summary,
        document_json: Some(document_json),
        markdown: None,
    })
}

#[tauri::command]
fn save_manuscript(
    app: tauri::AppHandle,
    id: String,
    document_json: String,
    markdown: Option<String>,
) -> Result<ManuscriptSummary, String> {
    if is_library_manuscript_id(&id) {
        let path_key = path_key_for_manuscript_id(&id).ok_or("Invalid library manuscript id")?;
        let markdown = markdown.ok_or("Markdown is required for library manuscripts")?;
        return write_library_markdown(&app, path_key, markdown);
    }
    save_internal_manuscript(app, id, document_json)
}

#[tauri::command]
fn import_markdown_file(app: tauri::AppHandle, path: String) -> Result<LoadedManuscript, String> {
    let (summary, markdown) = import_external_markdown(&app, path)?;
    Ok(LoadedManuscript {
        summary,
        document_json: None,
        markdown: Some(markdown),
    })
}

#[tauri::command]
fn reveal_in_file_manager(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let path = if is_library_manuscript_id(&id) {
        let path_key = path_key_for_manuscript_id(&id).ok_or("Invalid library manuscript id")?;
        absolute_path_for_entry(&app, &path_key)?
    } else {
        persistence::manuscript_dir(&app, &id)?
    };
    reveal_path(&path)
}

fn reveal_path(path: &std::path::Path) -> Result<(), String> {
    if !path.exists() {
        return Err("Path does not exist".into());
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-R")
            .arg(path)
            .spawn()
            .map_err(|error| error.to_string())?;
        return Ok(());
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(format!("/select,{}", path.display()))
            .spawn()
            .map_err(|error| error.to_string())?;
        return Ok(());
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        if let Some(parent) = path.parent() {
            Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|error| error.to_string())?;
        }
        return Ok(());
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows", unix)))]
    {
        let _ = path;
        Err("Reveal in file manager is not supported on this platform".into())
    }
}

#[tauri::command]
fn reveal_library_folder(app: tauri::AppHandle) -> Result<(), String> {
    let info = ensure_default_library(&app)?;
    reveal_path(std::path::Path::new(&info.root_path))
}

#[tauri::command]
fn save_recovery_snapshot(
    app: tauri::AppHandle,
    id: String,
    document_json: String,
) -> Result<(), String> {
    if is_library_manuscript_id(&id) {
        let path_key = path_key_for_manuscript_id(&id).ok_or("Invalid library manuscript id")?;
        let path = absolute_path_for_entry(&app, &path_key)?;
        let recovery_path = path.with_extension("prosa-recovery.json");
        std::fs::write(recovery_path, document_json).map_err(|error| error.to_string())?;
        return Ok(());
    }
    save_recovery_snapshot_impl(app, id, document_json)
}

#[tauri::command]
fn load_recovery_snapshot(app: tauri::AppHandle, id: String) -> Result<Option<String>, String> {
    if is_library_manuscript_id(&id) {
        let path_key = path_key_for_manuscript_id(&id).ok_or("Invalid library manuscript id")?;
        let path = absolute_path_for_entry(&app, &path_key)?;
        let recovery_path = path.with_extension("prosa-recovery.json");
        if !recovery_path.exists() {
            return Ok(None);
        }
        return Ok(Some(
            std::fs::read_to_string(recovery_path).map_err(|error| error.to_string())?,
        ));
    }
    load_recovery_snapshot_impl(app, id)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            list_manuscripts,
            get_library,
            init_library,
            set_library,
            create_manuscript,
            load_manuscript,
            save_manuscript,
            import_markdown_file,
            reveal_in_file_manager,
            reveal_library_folder,
            save_recovery_snapshot,
            load_recovery_snapshot
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
