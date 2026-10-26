#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConflictResolution {
    Ours,
    Theirs,
    Both,
}

/// Apply a resolution to all conflict regions in a UTF-8 file body.
pub fn resolve_conflict_markers(
    content: &str,
    resolution: ConflictResolution,
) -> Result<String, String> {
    let mut out = String::new();
    let mut lines = content.lines();
    let mut in_conflict = false;
    let mut section: u8 = 0; // 0 none, 1 ours, 2 theirs
    let mut ours = String::new();
    let mut theirs = String::new();

    let flush_conflict = |out: &mut String,
                          resolution: ConflictResolution,
                          ours: &str,
                          theirs: &str|
     -> Result<(), String> {
        let resolved = match resolution {
            ConflictResolution::Ours => ours.trim_end().to_string(),
            ConflictResolution::Theirs => theirs.trim_end().to_string(),
            ConflictResolution::Both => {
                let a = ours.trim_end();
                let b = theirs.trim_end();
                if a.is_empty() {
                    b.to_string()
                } else if b.is_empty() {
                    a.to_string()
                } else {
                    format!("{a}\n\n{b}")
                }
            }
        };
        if !out.is_empty() && !out.ends_with('\n') {
            out.push('\n');
        }
        out.push_str(&resolved);
        Ok(())
    };

    for line in lines.by_ref() {
        if line.starts_with("<<<<<<<") {
            if in_conflict {
                return Err("Nested conflict markers are not supported".into());
            }
            in_conflict = true;
            section = 1;
            ours.clear();
            theirs.clear();
            continue;
        }
        if in_conflict && line.starts_with("=======") {
            section = 2;
            continue;
        }
        if in_conflict && line.starts_with(">>>>>>>") {
            flush_conflict(&mut out, resolution, &ours, &theirs)?;
            in_conflict = false;
            section = 0;
            continue;
        }
        if in_conflict {
            match section {
                1 => {
                    if !ours.is_empty() {
                        ours.push('\n');
                    }
                    ours.push_str(line);
                }
                2 => {
                    if !theirs.is_empty() {
                        theirs.push('\n');
                    }
                    theirs.push_str(line);
                }
                _ => {}
            }
            continue;
        }
        if !out.is_empty() {
            out.push('\n');
        }
        out.push_str(line);
    }

    if in_conflict {
        return Err("Unclosed conflict marker block".into());
    }

    if content.ends_with('\n') && !out.ends_with('\n') {
        out.push('\n');
    }

    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_ours() {
        let input = "before\n<<<<<<< HEAD\nmine\n=======\ntheirs\n>>>>>>> feature\nafter\n";
        let out = resolve_conflict_markers(input, ConflictResolution::Ours).unwrap();
        assert!(out.contains("before"));
        assert!(out.contains("mine"));
        assert!(!out.contains("theirs"));
        assert!(out.contains("after"));
    }

    #[test]
    fn resolves_both() {
        let input = "<<<<<<< HEAD\nA\n=======\nB\n>>>>>>> feature\n";
        let out = resolve_conflict_markers(input, ConflictResolution::Both).unwrap();
        assert!(out.contains("A"));
        assert!(out.contains("B"));
    }
}
