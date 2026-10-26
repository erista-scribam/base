use std::path::{Path, PathBuf};
use std::process::Command;

fn resolve_prosa_binary() -> Result<PathBuf, String> {
    if let Ok(path) = std::env::var("SCRIBO_PROSA_BINARY") {
        let trimmed = path.trim();
        if !trimmed.is_empty() {
            return Ok(PathBuf::from(trimmed));
        }
    }

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let candidates = [
        manifest_dir.join("../../prosa/src-tauri/target/debug/prosa"),
        manifest_dir.join("../../prosa/src-tauri/target/debug/prosa.exe"),
        manifest_dir.join(
            "../../prosa/src-tauri/target/debug/bundle/macos/Scribo Prosa.app/Contents/MacOS/prosa",
        ),
    ];
    for candidate in candidates {
        if candidate.is_file() {
            return Ok(candidate);
        }
    }

    Err(
        "Prosa binary not found. Build Prosa once (`pnpm tauri:dev` or `cargo build -p prosa`) or set SCRIBO_PROSA_BINARY.".into(),
    )
}

pub fn open_project_in_prosa(project_root: &Path) -> Result<(), String> {
    let root = project_root
        .canonicalize()
        .unwrap_or_else(|_| project_root.to_path_buf());
    if !root.join("scribo.project.json").is_file() {
        return Err("Not a Scribo project folder".into());
    }

    let prosa_binary = resolve_prosa_binary()?;

    let mut command = Command::new(&prosa_binary);
    command.env("SCRIBO_PROJECT_ROOT", &root);
    command.env("SCRIBO_LAUNCHED_FROM_LANISTA", "1");
    command.spawn().map_err(|error| {
        format!(
            "Failed to launch Prosa ({}): {error}",
            prosa_binary.display()
        )
    })?;
    Ok(())
}
