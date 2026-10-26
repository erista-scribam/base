import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type { ManuscriptSummary } from "@scribo/core";
import type { GitChangedFile } from "../features/version-control/project-version-control";
import { gitStatusForManuscriptPath } from "../features/version-control/git-file-status";
import {
  buildProjectTree,
  listProjectTree,
  splitRepoPath,
  type ProjectTreeNode,
} from "../features/projects/project-tree";
import { GitFileStatusBadge } from "./GitFileStatusBadge";

const TREE_INDENT_PX = 12;
const TREE_BASE_PADDING_PX = 6;

type PendingCreate = { kind: "file" | "folder"; parentRelative: string | null };

type ContextMenuState = {
  x: number;
  y: number;
  parentRelative: string | null;
  fileId: string | null;
  fileLabel: string | null;
};

export interface ProjectFilesExplorerProps {
  refreshKey: number;
  activeId: string | null;
  changedFiles: GitChangedFile[];
  selectedFolderPath: string | null;
  onSelectFolder: (relativePath: string | null) => void;
  onSelectManuscript: (id: string) => void;
  onCreateFile: (parentRelative: string | null, title: string) => void;
  onCreateFolder: (parentRelative: string | null, folderName: string) => void;
  onRevealManuscript: (id: string) => void;
  onDelete: (id: string) => void;
  onImportMarkdown: () => void;
  manuscriptsById: Map<string, ManuscriptSummary>;
}

export function ProjectFilesExplorer({
  refreshKey,
  activeId,
  changedFiles,
  selectedFolderPath,
  onSelectFolder,
  onSelectManuscript,
  onCreateFile,
  onCreateFolder,
  onRevealManuscript,
  onDelete,
  onImportMarkdown,
  manuscriptsById,
}: ProjectFilesExplorerProps) {
  const [roots, setRoots] = useState<ProjectTreeNode[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingCreate, setPendingCreate] = useState<PendingCreate | null>(null);
  const [createName, setCreateName] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listProjectTree()
      .then((entries) => {
        if (!cancelled) {
          setRoots(buildProjectTree(entries));
          setLoadError(null);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setRoots([]);
          setLoadError(cause instanceof Error ? cause.message : "Could not load project tree");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [contextMenu]);

  const toggleCollapsed = useCallback((path: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const openContextMenu = useCallback(
    (
      event: ReactMouseEvent,
      target: { parentRelative: string | null; fileId?: string | null; fileLabel?: string | null },
    ) => {
      event.preventDefault();
      event.stopPropagation();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        parentRelative: target.parentRelative,
        fileId: target.fileId ?? null,
        fileLabel: target.fileLabel ?? null,
      });
    },
    [],
  );

  const beginCreate = useCallback(
    (kind: "file" | "folder", parentRelative: string | null) => {
      setContextMenu(null);
      if (parentRelative) {
        setCollapsed((current) => {
          const next = new Set(current);
          next.delete(parentRelative);
          return next;
        });
        onSelectFolder(parentRelative);
      } else {
        onSelectFolder(null);
      }
      setPendingCreate({ kind, parentRelative });
      setCreateName(kind === "file" ? "untitled.md" : "new-folder");
    },
    [onSelectFolder],
  );

  const submitCreate = useCallback(() => {
    const trimmed = createName.trim();
    if (!trimmed || !pendingCreate) {
      return;
    }
    if (pendingCreate.kind === "file") {
      onCreateFile(pendingCreate.parentRelative, trimmed);
    } else {
      onCreateFolder(pendingCreate.parentRelative, trimmed);
    }
    setPendingCreate(null);
    setCreateName("");
  }, [createName, onCreateFile, onCreateFolder, pendingCreate]);

  const cancelCreate = useCallback(() => {
    setPendingCreate(null);
    setCreateName("");
  }, []);

  const tree = useMemo(() => roots, [roots]);

  if (loadError) {
    return <p className="app-sidebar-empty">{loadError}</p>;
  }

  const treeProps = {
    collapsed,
    onToggleCollapsed: toggleCollapsed,
    activeId,
    selectedFolderPath,
    changedFiles,
    manuscriptsById,
    onSelectFolder,
    onSelectManuscript,
    onRevealManuscript,
    pendingCreate,
    createName,
    setCreateName,
    submitCreate,
    cancelCreate,
    openContextMenu,
  };

  return (
    <div className="project-tree-shell">
      {tree.length === 0 && !pendingCreate ? (
        <p
          className="app-sidebar-empty project-tree-empty"
          onContextMenu={(event) => openContextMenu(event, { parentRelative: null })}
        >
          Right-click to add a file or folder.
        </p>
      ) : (
        <ul
          className="project-tree"
          role="tree"
          onContextMenu={(event) => {
            if (event.target === event.currentTarget) {
              openContextMenu(event, { parentRelative: null });
            }
          }}
        >
          {pendingCreate?.parentRelative === null ? (
            <InlineCreateRow
              depth={0}
              pendingCreate={pendingCreate}
              createName={createName}
              setCreateName={setCreateName}
              onSubmit={submitCreate}
              onCancel={cancelCreate}
            />
          ) : null}
          {tree.map((node) => (
            <TreeNodeRow key={node.relativePath} node={node} depth={0} {...treeProps} />
          ))}
        </ul>
      )}

      {contextMenu ? (
        <div
          className="explorer-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            className="explorer-context-menu-item"
            onClick={() => beginCreate("file", contextMenu.parentRelative)}
          >
            New File
          </button>
          <button
            type="button"
            role="menuitem"
            className="explorer-context-menu-item"
            onClick={() => beginCreate("folder", contextMenu.parentRelative)}
          >
            New Folder
          </button>
          {!contextMenu.fileId && contextMenu.parentRelative === null ? (
            <>
              <div className="explorer-context-menu-sep" role="separator" />
              <button
                type="button"
                role="menuitem"
                className="explorer-context-menu-item"
                onClick={() => {
                  setContextMenu(null);
                  onImportMarkdown();
                }}
              >
                Import Markdown…
              </button>
            </>
          ) : null}
          {contextMenu.fileId ? (
            <>
              <div className="explorer-context-menu-sep" role="separator" />
              <button
                type="button"
                role="menuitem"
                className="explorer-context-menu-item"
                onClick={() => {
                  setContextMenu(null);
                  onSelectManuscript(contextMenu.fileId!);
                }}
              >
                Open
              </button>
              <button
                type="button"
                role="menuitem"
                className="explorer-context-menu-item"
                onClick={() => {
                  setContextMenu(null);
                  onRevealManuscript(contextMenu.fileId!);
                }}
              >
                Reveal in Finder
              </button>
              <button
                type="button"
                role="menuitem"
                className="explorer-context-menu-item explorer-context-menu-danger"
                onClick={() => {
                  setContextMenu(null);
                  onDelete(contextMenu.fileId!);
                }}
              >
                Delete
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function treePadding(depth: number): CSSProperties {
  return { paddingLeft: `${TREE_BASE_PADDING_PX + depth * TREE_INDENT_PX}px` };
}

function InlineCreateRow({
  depth,
  pendingCreate,
  createName,
  setCreateName,
  onSubmit,
  onCancel,
}: {
  depth: number;
  pendingCreate: PendingCreate;
  createName: string;
  setCreateName: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <li className="project-tree-node project-tree-create-node" role="none">
      <form
        className="project-tree-row project-tree-create-row"
        style={treePadding(depth)}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <span className="project-tree-disclosure project-tree-disclosure-spacer" aria-hidden />
        <input
          type="text"
          className="project-tree-create-input"
          value={createName}
          placeholder={pendingCreate.kind === "file" ? "File name" : "Folder name"}
          autoFocus
          onChange={(event) => setCreateName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onCancel();
            }
          }}
        />
      </form>
    </li>
  );
}

function TreeNodeRow({
  node,
  depth,
  collapsed,
  onToggleCollapsed,
  activeId,
  selectedFolderPath,
  changedFiles,
  manuscriptsById,
  onSelectFolder,
  onSelectManuscript,
  onRevealManuscript,
  pendingCreate,
  createName,
  setCreateName,
  submitCreate,
  cancelCreate,
  openContextMenu,
}: {
  node: ProjectTreeNode;
  depth: number;
  collapsed: Set<string>;
  onToggleCollapsed: (path: string) => void;
  activeId: string | null;
  selectedFolderPath: string | null;
  changedFiles: GitChangedFile[];
  manuscriptsById: Map<string, ManuscriptSummary>;
  onSelectFolder: (relativePath: string | null) => void;
  onSelectManuscript: (id: string) => void;
  onRevealManuscript: (id: string) => void;
  pendingCreate: PendingCreate | null;
  createName: string;
  setCreateName: (value: string) => void;
  submitCreate: () => void;
  cancelCreate: () => void;
  openContextMenu: (
    event: ReactMouseEvent,
    target: { parentRelative: string | null; fileId?: string | null; fileLabel?: string | null },
  ) => void;
}) {
  const isFolder = node.kind === "folder";
  const isCollapsed = isFolder && collapsed.has(node.relativePath);
  const manuscript = node.manuscriptId ? manuscriptsById.get(node.manuscriptId) : undefined;
  const gitEntry = gitStatusForManuscriptPath(node.relativePath, changedFiles);

  if (isFolder) {
    return (
      <li className="project-tree-node" role="treeitem" aria-expanded={!isCollapsed}>
        <div
          className="project-tree-row"
          style={treePadding(depth)}
          onContextMenu={(event) => openContextMenu(event, { parentRelative: node.relativePath })}
        >
          <button
            type="button"
            className="project-tree-disclosure"
            aria-label={isCollapsed ? `Expand ${node.name}` : `Collapse ${node.name}`}
            aria-expanded={!isCollapsed}
            onClick={() => onToggleCollapsed(node.relativePath)}
          >
            {isCollapsed ? <IconChevronRight /> : <IconChevronDown />}
          </button>
          <button
            type="button"
            className="project-tree-entry"
            data-kind="folder"
            data-selected={selectedFolderPath === node.relativePath ? "true" : undefined}
            onClick={() => onSelectFolder(node.relativePath)}
          >
            <IconFolder />
            <span className="project-tree-name">{node.name}</span>
          </button>
        </div>
        {!isCollapsed ? (
          <ul className="project-tree-children" role="group">
            {pendingCreate?.parentRelative === node.relativePath ? (
              <InlineCreateRow
                depth={depth + 1}
                pendingCreate={pendingCreate}
                createName={createName}
                setCreateName={setCreateName}
                onSubmit={submitCreate}
                onCancel={cancelCreate}
              />
            ) : null}
            {node.children.map((child) => (
              <TreeNodeRow
                key={child.relativePath}
                node={child}
                depth={depth + 1}
                collapsed={collapsed}
                onToggleCollapsed={onToggleCollapsed}
                activeId={activeId}
                selectedFolderPath={selectedFolderPath}
                changedFiles={changedFiles}
                manuscriptsById={manuscriptsById}
                onSelectFolder={onSelectFolder}
                onSelectManuscript={onSelectManuscript}
                onRevealManuscript={onRevealManuscript}
                pendingCreate={pendingCreate}
                createName={createName}
                setCreateName={setCreateName}
                submitCreate={submitCreate}
                cancelCreate={cancelCreate}
                openContextMenu={openContextMenu}
              />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  const id = node.manuscriptId ?? manuscript?.id;
  if (!id) {
    return null;
  }

  const label = node.name;

  return (
    <li className="project-tree-node" role="treeitem">
      <div
        className="project-tree-row project-tree-row-file"
        style={treePadding(depth)}
        onContextMenu={(event) => {
          const { directory } = splitRepoPath(node.relativePath);
          openContextMenu(event, {
            parentRelative: directory || null,
            fileId: id,
            fileLabel: label,
          });
        }}
      >
        <span className="project-tree-disclosure project-tree-disclosure-spacer" aria-hidden />
        <button
          type="button"
          className="project-tree-entry"
          data-kind="file"
          data-active={activeId === id ? "true" : undefined}
          onClick={() => onSelectManuscript(id)}
        >
          <IconFile />
          <span className="project-tree-name">{label}</span>
          {gitEntry ? <GitFileStatusBadge status={gitEntry.status} /> : null}
        </button>
      </div>
    </li>
  );
}

function IconChevronRight() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="project-tree-svg-icon"
      aria-hidden
    >
      <path d="M3 7v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="project-tree-svg-icon project-tree-svg-icon-muted"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
