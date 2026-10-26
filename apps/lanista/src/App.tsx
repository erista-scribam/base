import { useCallback, useEffect, useState } from "react";
import { LanistaBrandHeader } from "./components/LanistaBrandHeader";
import {
  createLanistaProject,
  getLanistaHome,
  listLanistaProjects,
  openProjectInProsa,
  type LanistaProject,
} from "./lanista-api";

export function App() {
  const [homePath, setHomePath] = useState<string | null>(null);
  const [projects, setProjects] = useState<LanistaProject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");

  const refresh = useCallback(async () => {
    setError(null);
    const home = await getLanistaHome();
    setHomePath(home.homePath);
    const items = await listLanistaProjects();
    setProjects(items);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const home = await getLanistaHome();
        const items = await listLanistaProjects();
        if (!cancelled) {
          setHomePath(home.homePath);
          setProjects(items);
          setError(null);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Failed to load projects");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = useCallback(async () => {
    const name = newName.trim();
    if (!name) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createLanistaProject(name);
      setNewName("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create project");
    } finally {
      setBusy(false);
    }
  }, [newName, refresh]);

  const handleOpen = useCallback(async (rootPath: string) => {
    setBusy(true);
    setError(null);
    try {
      await openProjectInProsa(rootPath);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not launch Prosa");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <div className="app">
      <LanistaBrandHeader />
      <p className="sub home-path">Projects home — {homePath ?? "…"}</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="toolbar">
        <input
          type="text"
          placeholder="New project name"
          value={newName}
          disabled={busy}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handleCreate();
            }
          }}
          style={{
            flex: 1,
            padding: "0.45rem 0.65rem",
            borderRadius: 8,
            border: "1px solid #3a3f4b",
            background: "#1a1d24",
            color: "inherit",
          }}
        />
        <button
          type="button"
          className="primary"
          disabled={busy}
          onClick={() => void handleCreate()}
        >
          Create
        </button>
        <button type="button" disabled={busy} onClick={() => void refresh()}>
          Refresh
        </button>
      </div>
      <ul className="projects">
        {projects.map((project) => (
          <li key={project.rootPath} className="project">
            <div>
              <div className="project-title">{project.title}</div>
              <div className="project-path">{project.rootPath}</div>
            </div>
            <button type="button" disabled={busy} onClick={() => void handleOpen(project.rootPath)}>
              Open in Prosa
            </button>
          </li>
        ))}
      </ul>
      {projects.length === 0 ? <p className="sub">No projects yet. Create one above.</p> : null}
    </div>
  );
}
