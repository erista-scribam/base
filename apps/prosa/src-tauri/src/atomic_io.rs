use std::fs;
use std::io::Write;
use std::path::Path;

/// Write `contents` atomically: temp file in the same directory, then rename.
pub fn atomic_write(path: &Path, contents: &str) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| "Cannot resolve parent directory for atomic write".to_string())?;
    fs::create_dir_all(parent).map_err(|error| error.to_string())?;

    let file_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "Invalid target file name".to_string())?;
    let temp_path = parent.join(format!(".{file_name}.scribam-tmp-{}", uuid::Uuid::new_v4()));

    {
        let mut file = fs::File::create(&temp_path).map_err(|error| error.to_string())?;
        file.write_all(contents.as_bytes())
            .map_err(|error| error.to_string())?;
        file.sync_all().map_err(|error| error.to_string())?;
    }

    match fs::rename(&temp_path, path) {
        Ok(()) => Ok(()),
        Err(error) => {
            let _ = fs::remove_file(&temp_path);
            Err(error.to_string())
        }
    }
}
