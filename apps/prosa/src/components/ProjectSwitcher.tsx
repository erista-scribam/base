import { useEffect, useId, useRef, useState } from "react";
import type { ProjectSummary } from "@scribo/core";
import { listProjects } from "../features/projects/project-catalog";

export interface ProjectSwitcherProps {
  currentRootPath: string | null;
  projectTitle: string | null;
  onOpenProject: () => void;
  onCreateProject: () => void;
  onSwitchProject: (rootPath: string) => void;
  onRevealProject: () => void;
}

function formatProjectPath(path: string): string {
  const parts = path.split(/[/\\]/).filter(Boolean);
  if (parts.length <= 2) {
    return path.replace(/^\/Users\/[^/]+/, "~");
  }
  return `~/${parts.slice(-2).join("/")}`;
}

export function ProjectSwitcher({
  currentRootPath,
  projectTitle,
  onOpenProject,
  onCreateProject,
  onSwitchProject,
  onRevealProject,
}: ProjectSwitcherProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    void listProjects()
      .then((entries) => {
        if (!cancelled) {
          setProjects(entries);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProjects([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, currentRootPath]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!currentRootPath) {
    return null;
  }

  const title = projectTitle ?? "Untitled project";

  return (
    <div className="project-switcher" ref={rootRef}>
      <button
        type="button"
        className="project-switcher-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="project-switcher-kicker">Project</span>
        <span className="project-switcher-title">{title}</span>
        <span className="project-switcher-path" title={currentRootPath}>
          {formatProjectPath(currentRootPath)}
        </span>
      </button>
      <button
        type="button"
        className="icon-btn project-switcher-reveal"
        aria-label="Show project in Finder"
        title="Show in Finder"
        onClick={onRevealProject}
      >
        <IconReveal />
      </button>
      {open ? (
        <div className="project-switcher-menu" id={menuId} role="menu">
          <p className="project-switcher-menu-label">Recent projects</p>
          <ul className="project-switcher-list">
            {projects.length === 0 ? (
              <li className="project-switcher-empty">No recent projects yet.</li>
            ) : (
              projects.map((project) => (
                <li key={project.rootPath}>
                  <button
                    type="button"
                    role="menuitem"
                    className="project-switcher-item"
                    data-current={project.isCurrent ? "true" : undefined}
                    onClick={() => {
                      setOpen(false);
                      if (!project.isCurrent) {
                        onSwitchProject(project.rootPath);
                      }
                    }}
                  >
                    <span className="project-switcher-item-title">{project.title}</span>
                    <span className="project-switcher-item-path">
                      {formatProjectPath(project.rootPath)}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="project-switcher-menu-actions">
            <button type="button" className="sc-btn sc-btn-block" onClick={onOpenProject}>
              Open project folder…
            </button>
            <button type="button" className="sc-btn sc-btn-block" onClick={onCreateProject}>
              New project…
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function IconReveal() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}
