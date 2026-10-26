mod atomic_io;
#[cfg(feature = "git-spike")]
mod git_spike;
mod library;
#[cfg(feature = "git-vcs")]
mod merge_conflicts;
mod persistence;
mod project;
#[cfg(feature = "git-vcs")]
mod project_git;
mod recovery;

use crate::atomic_io::atomic_write;
use library::{
    LibraryInfo, ProjectSummary, absolute_path_for_entry, clear_library_recovery,
    create_library_markdown_in_parent, create_library_markdown_with_content, create_project_folder,
    create_project_root, delete_library_manuscript, ensure_default_library, get_library_info,
    import_external_markdown, is_library_manuscript_id, library_recovery_path,
    list_library_manuscripts, list_project_entries, list_projects, migrate_legacy_root_markdown,
    open_project_root, path_key_for_manuscript_id, read_library_markdown, set_library_root,
    write_library_markdown,
};
use persistence::{
    ManuscriptSummary, clear_recovery_snapshot as clear_internal_recovery_snapshot,
    delete_internal_manuscript, list_manuscripts as list_internal_manuscripts,
    load_manuscript as load_internal_manuscript,
    load_recovery_snapshot as load_recovery_snapshot_impl,
    save_recovery_snapshot as save_recovery_snapshot_impl,
};
use recovery::{parse_recovery, wrap_recovery};
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;

#[cfg(feature = "git-vcs")]
use project_git::{
    GitGraphCommit, MergeConflictFilePreview, ProjectVersionControl,
    abort_project_merge as git_abort_merge, checkout_project_branch as git_checkout_branch,
    commit_project_checkpoint as git_commit_checkpoint,
    complete_project_merge as git_complete_merge, create_project_branch as git_create_branch,
    merge_conflict_preview as git_merge_conflict_preview, merge_project_branch as git_merge_branch,
    project_git_graph as git_project_graph, project_version_control as git_project_status,
    resolve_project_merge_file as git_resolve_merge_file,
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LoadedManuscript {
    summary: ManuscriptSummary,
    #[serde(skip_serializing_if = "Option::is_none")]
    document_json: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    markdown: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RecoverySnapshot {
    captured_at: String,
    document_json: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DiskRevision {
    modified_at: String,
}

#[tauri::command]
fn list_manuscripts(app: tauri::AppHandle) -> Result<Vec<ManuscriptSummary>, String> {
    let _ = ensure_default_library(&app);
    let mut merged = list_library_manuscripts(&app).unwrap_or_default();
    merged.extend(list_internal_manuscripts(app)?);
    merged.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(merged)
}

#[tauri::command]
fn list_legacy_internal_manuscripts(
    app: tauri::AppHandle,
) -> Result<Vec<ManuscriptSummary>, String> {
    list_internal_manuscripts(app)
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
fn migrate_legacy_root_manuscripts(app: tauri::AppHandle) -> Result<u32, String> {
    ensure_default_library(&app)?;
    migrate_legacy_root_markdown(&app)
}

fn library_root_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let info = ensure_default_library(app)?;
    Ok(Path::new(&info.root_path).to_path_buf())
}

#[cfg(feature = "git-vcs")]
#[tauri::command]
fn get_project_version_control(app: tauri::AppHandle) -> Result<ProjectVersionControl, String> {
    git_project_status(&library_root_path(&app)?)
}

#[cfg(feature = "git-vcs")]
#[tauri::command]
fn commit_project_checkpoint(
    app: tauri::AppHandle,
    message: String,
) -> Result<ProjectVersionControl, String> {
    git_commit_checkpoint(&library_root_path(&app)?, &message)
}

#[cfg(feature = "git-vcs")]
#[tauri::command]
fn create_project_branch(
    app: tauri::AppHandle,
    name: String,
) -> Result<ProjectVersionControl, String> {
    git_create_branch(&library_root_path(&app)?, &name)
}

#[cfg(feature = "git-vcs")]
#[tauri::command]
fn checkout_project_branch(
    app: tauri::AppHandle,
    name: String,
) -> Result<ProjectVersionControl, String> {
    git_checkout_branch(&library_root_path(&app)?, &name)
}

#[cfg(feature = "git-vcs")]
#[tauri::command]
fn get_project_git_graph(
    app: tauri::AppHandle,
    limit: Option<u32>,
) -> Result<Vec<GitGraphCommit>, String> {
    let limit = limit.unwrap_or(40) as usize;
    git_project_graph(&library_root_path(&app)?, limit)
}

#[cfg(feature = "git-vcs")]
#[tauri::command]
fn merge_project_branch(
    app: tauri::AppHandle,
    source_branch: String,
) -> Result<ProjectVersionControl, String> {
    git_merge_branch(&library_root_path(&app)?, &source_branch)
}

#[cfg(feature = "git-vcs")]
#[tauri::command]
fn abort_project_merge(app: tauri::AppHandle) -> Result<ProjectVersionControl, String> {
    git_abort_merge(&library_root_path(&app)?)
}

#[cfg(feature = "git-vcs")]
#[tauri::command]
fn resolve_project_merge_file(
    app: tauri::AppHandle,
    relative_path: String,
    resolution: String,
) -> Result<ProjectVersionControl, String> {
    git_resolve_merge_file(&library_root_path(&app)?, &relative_path, &resolution)
}

#[cfg(feature = "git-vcs")]
#[tauri::command]
fn complete_project_merge(
    app: tauri::AppHandle,
    message: Option<String>,
) -> Result<ProjectVersionControl, String> {
    git_complete_merge(&library_root_path(&app)?, message.as_deref())
}

#[cfg(feature = "git-vcs")]
#[tauri::command]
fn get_merge_conflict_preview(
    app: tauri::AppHandle,
    relative_path: String,
) -> Result<MergeConflictFilePreview, String> {
    git_merge_conflict_preview(&library_root_path(&app)?, &relative_path)
}

#[tauri::command]
fn set_library(app: tauri::AppHandle, root_path: String) -> Result<LibraryInfo, String> {
    set_library_root(&app, root_path)
}

#[tauri::command]
fn list_projects_catalog(app: tauri::AppHandle) -> Result<Vec<ProjectSummary>, String> {
    list_projects(&app)
}

#[tauri::command]
fn open_project(app: tauri::AppHandle, root_path: String) -> Result<LibraryInfo, String> {
    open_project_root(&app, PathBuf::from(root_path))
}

#[tauri::command]
fn create_project(
    app: tauri::AppHandle,
    parent_path: String,
    name: String,
) -> Result<LibraryInfo, String> {
    create_project_root(&app, parent_path, name)
}

#[tauri::command]
fn list_project_tree(app: tauri::AppHandle) -> Result<Vec<library::ProjectEntry>, String> {
    list_project_entries(&app)
}

#[tauri::command]
fn create_project_folder_entry(
    app: tauri::AppHandle,
    parent_relative: Option<String>,
    folder_name: String,
) -> Result<library::ProjectEntry, String> {
    ensure_default_library(&app)?;
    create_project_folder(&app, parent_relative, folder_name)
}

#[tauri::command]
fn create_manuscript(
    app: tauri::AppHandle,
    title: String,
    parent_relative: Option<String>,
    _document_json: String,
) -> Result<LoadedManuscript, String> {
    ensure_default_library(&app)?;
    let (summary, markdown) =
        create_library_markdown_in_parent(&app, parent_relative, title, String::new())?;
    Ok(LoadedManuscript {
        summary,
        document_json: None,
        markdown: Some(markdown),
    })
}

#[tauri::command]
fn migrate_internal_manuscript(
    app: tauri::AppHandle,
    id: String,
    title: String,
    markdown: String,
) -> Result<LoadedManuscript, String> {
    ensure_default_library(&app)?;
    let (summary, markdown) = create_library_markdown_with_content(&app, title, markdown)?;
    delete_internal_manuscript(&app, &id)?;
    Ok(LoadedManuscript {
        summary,
        document_json: None,
        markdown: Some(markdown),
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
        let (created, modified) = library::file_created_modified(&path);
        let summary = ManuscriptSummary {
            id: id.clone(),
            title: path
                .file_stem()
                .and_then(|stem| stem.to_str())
                .unwrap_or("Untitled")
                .to_string(),
            updated_at: modified,
            created_at: Some(created),
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
        let title = serde_json::from_str::<serde_json::Value>(&document_json)
            .ok()
            .and_then(|value| {
                value
                    .get("title")
                    .and_then(|t| t.as_str())
                    .map(str::to_string)
            });
        return write_library_markdown(&app, path_key, title, markdown);
    }
    Err("Legacy app-storage manuscripts are read-only. Move them to the library.".into())
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
    if !is_library_manuscript_id(&id) {
        return Err("legacy_internal_manuscript".into());
    }
    let path_key = path_key_for_manuscript_id(&id).ok_or("Invalid library manuscript id")?;
    let path = absolute_path_for_entry(&app, &path_key)?;
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
        Ok(())
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(format!("/select,{}", path.display()))
            .spawn()
            .map_err(|error| error.to_string())?;
        Ok(())
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        if let Some(parent) = path.parent() {
            Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|error| error.to_string())?;
        }
        Ok(())
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
        let recovery_path = library_recovery_path(&app, &path_key)?;
        atomic_write(&recovery_path, &wrap_recovery(document_json))?;
        return Ok(());
    }
    save_recovery_snapshot_impl(app, id, document_json)
}

#[tauri::command]
fn load_recovery_snapshot(
    app: tauri::AppHandle,
    id: String,
) -> Result<Option<RecoverySnapshot>, String> {
    if is_library_manuscript_id(&id) {
        let path_key = path_key_for_manuscript_id(&id).ok_or("Invalid library manuscript id")?;
        let recovery_path = library_recovery_path(&app, &path_key)?;
        if !recovery_path.exists() {
            return Ok(None);
        }
        let raw = std::fs::read_to_string(recovery_path).map_err(|error| error.to_string())?;
        let payload = parse_recovery(&raw);
        return Ok(Some(RecoverySnapshot {
            captured_at: payload.captured_at,
            document_json: payload.document_json,
        }));
    }
    let payload = load_recovery_snapshot_impl(app, id)?;
    Ok(payload.map(|entry| RecoverySnapshot {
        captured_at: entry.captured_at,
        document_json: entry.document_json,
    }))
}

#[tauri::command]
fn clear_recovery_snapshot(app: tauri::AppHandle, id: String) -> Result<(), String> {
    if is_library_manuscript_id(&id) {
        let path_key = path_key_for_manuscript_id(&id).ok_or("Invalid library manuscript id")?;
        return clear_library_recovery(&app, &path_key);
    }
    clear_internal_recovery_snapshot(&app, &id)
}

#[tauri::command]
fn delete_manuscript(app: tauri::AppHandle, id: String) -> Result<(), String> {
    if is_library_manuscript_id(&id) {
        delete_library_manuscript(&app, &id)
    } else {
        clear_internal_recovery_snapshot(&app, &id)?;
        delete_internal_manuscript(&app, &id)
    }
}

#[tauri::command]
fn get_manuscript_disk_revision(app: tauri::AppHandle, id: String) -> Result<DiskRevision, String> {
    let modified_at = if is_library_manuscript_id(&id) {
        let path_key = path_key_for_manuscript_id(&id).ok_or("Invalid library manuscript id")?;
        let path = absolute_path_for_entry(&app, &path_key)?;
        file_modified_rfc3339(&path)?
    } else {
        let path = persistence::manuscript_dir(&app, &id)?.join("document.json");
        file_modified_rfc3339(&path)?
    };
    Ok(DiskRevision { modified_at })
}

fn file_modified_rfc3339(path: &std::path::Path) -> Result<String, String> {
    let metadata = std::fs::metadata(path).map_err(|error| error.to_string())?;
    let modified = metadata.modified().map_err(|error| error.to_string())?;
    Ok(chrono::DateTime::<chrono::Utc>::from(modified).to_rfc3339())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            list_manuscripts,
            list_legacy_internal_manuscripts,
            get_library,
            init_library,
            set_library,
            list_projects_catalog,
            open_project,
            create_project,
            list_project_tree,
            create_project_folder_entry,
            create_manuscript,
            migrate_internal_manuscript,
            load_manuscript,
            save_manuscript,
            import_markdown_file,
            reveal_in_file_manager,
            reveal_library_folder,
            save_recovery_snapshot,
            load_recovery_snapshot,
            clear_recovery_snapshot,
            delete_manuscript,
            get_manuscript_disk_revision,
            migrate_legacy_root_manuscripts,
            get_project_version_control,
            commit_project_checkpoint,
            create_project_branch,
            checkout_project_branch,
            get_project_git_graph,
            merge_project_branch,
            abort_project_merge,
            resolve_project_merge_file,
            complete_project_merge,
            get_merge_conflict_preview
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
