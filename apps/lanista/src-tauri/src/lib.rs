mod catalog;
mod launch;

use catalog::{LanistaProject, create_project, home_path, list_projects};
use launch::open_project_in_prosa as launch_prosa;
use std::path::PathBuf;

#[tauri::command]
fn get_lanista_home(app: tauri::AppHandle) -> Result<LanistaHomePayload, String> {
    Ok(LanistaHomePayload {
        home_path: home_path(&app)?,
    })
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct LanistaHomePayload {
    home_path: String,
}

#[tauri::command]
fn list_lanista_projects(app: tauri::AppHandle) -> Result<Vec<LanistaProject>, String> {
    list_projects(&app)
}

#[tauri::command]
fn create_lanista_project(app: tauri::AppHandle, name: String) -> Result<LanistaProject, String> {
    create_project(&app, name)
}

#[tauri::command]
fn open_project_in_prosa(_app: tauri::AppHandle, root_path: String) -> Result<(), String> {
    launch_prosa(&PathBuf::from(root_path))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_lanista_home,
            list_lanista_projects,
            create_lanista_project,
            open_project_in_prosa
        ])
        .run(tauri::generate_context!())
        .expect("error while running lanista application");
}
