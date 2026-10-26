import { useCallback, useEffect, useMemo, useState } from "react";
import type { ManuscriptSummary } from "@scribo/core";
import type { GitChangedFile } from "../features/version-control/project-version-control";
import { gitStatusForManuscriptPath } from "../features/version-control/git-file-status";
import {
  buildProjectTree,
  listProjectTree,
  type ProjectTreeNode,
} from "../features/projects/project-tree";
import type { LibraryViewMode } from "../hooks/useLibraryViewMode";
import {
  formatCompactMeta,
  formatManuscriptEdited,
  formatManuscriptPath,
  formatManuscriptTimestamp,
} from "../features/library/manuscript-list-meta";
import { GitFileStatusBadge } from "./GitFileStatusBadge";

export interface ProjectFilesExplorerProps {
  refreshKey: number;
  activeId: string | null;
  libraryViewMode: LibraryViewMode;
  changedFiles: GitChangedFile[];
  selectedFolderPath: string | null;
  onSelectFolder: (relativePath: string | null) => void;
  onSelectManuscript: (id: string) => void;
  onDelete: (id: string) => void;
  manuscriptsById: Map<string, ManuscriptSummary>;
}

export function ProjectFilesExplorer({
  refreshKey,
  activeId,
  libraryViewMode,
  changedFiles,
  selectedFolderPath,
  onSelectFolder,
  onSelectManuscript,
  onDelete,
  manuscriptsById,
}: ProjectFilesExplorerProps) {
  const [roots, setRoots] = useState<ProjectTreeNode[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const tree = useMemo(() => roots, [roots]);

  if (loadError) {
    return <p className="app-sidebar-empty">{loadError}</p>;
  }

  if (tree.length === 0) {
    return (
      <p className="app-sidebar-empty">
        No files yet. Create a folder or markdown file to start writing.
      </p>
    );
  }

  return (
    <ul className="project-tree" data-library-view={libraryViewMode}>
      {tree.map((node) => (
        <TreeNodeRow
          key={node.relativePath}
          node={node}
          depth={0}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          activeId={activeId}
          selectedFolderPath={selectedFolderPath}
          libraryViewMode={libraryViewMode}
          changedFiles={changedFiles}
          manuscriptsById={manuscriptsById}
          onSelectFolder={onSelectFolder}
          onSelectManuscript={onSelectManuscript}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

function TreeNodeRow({
  node,
  depth,
  collapsed,
  onToggleCollapsed,
  activeId,
  selectedFolderPath,
  libraryViewMode,
  changedFiles,
  manuscriptsById,
  onSelectFolder,
  onSelectManuscript,
  onDelete,
}: {
  node: ProjectTreeNode;
  depth: number;
  collapsed: Set<string>;
  onToggleCollapsed: (path: string) => void;
  activeId: string | null;
  selectedFolderPath: string | null;
  libraryViewMode: LibraryViewMode;
  changedFiles: GitChangedFile[];
  manuscriptsById: Map<string, ManuscriptSummary>;
  onSelectFolder: (relativePath: string | null) => void;
  onSelectManuscript: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isFolder = node.kind === "folder";
  const isCollapsed = isFolder && collapsed.has(node.relativePath);
  const manuscript = node.manuscriptId ? manuscriptsById.get(node.manuscriptId) : undefined;
  const gitEntry = gitStatusForManuscriptPath(node.relativePath, changedFiles);

  if (isFolder) {
    return (
      <li className="project-tree-node">
        <div className="project-tree-row" style={{ paddingLeft: `${depth * 0.75 + 0.5}rem` }}>
          <button
            type="button"
            className="project-tree-disclosure"
            aria-expanded={!isCollapsed}
            onClick={() => onToggleCollapsed(node.relativePath)}
          >
            {isCollapsed ? "▸" : "▾"}
          </button>
          <button
            type="button"
            className="project-tree-folder"
            data-selected={selectedFolderPath === node.relativePath ? "true" : undefined}
            onClick={() => onSelectFolder(node.relativePath)}
          >
            <span className="project-tree-icon project-tree-icon-folder" aria-hidden />
            <span className="project-tree-label">{node.name}</span>
          </button>
        </div>
        {!isCollapsed && node.children.length > 0 ? (
          <ul className="project-tree-children">
            {node.children.map((child) => (
              <TreeNodeRow
                key={child.relativePath}
                node={child}
                depth={depth + 1}
                collapsed={collapsed}
                onToggleCollapsed={onToggleCollapsed}
                activeId={activeId}
                selectedFolderPath={selectedFolderPath}
                libraryViewMode={libraryViewMode}
                changedFiles={changedFiles}
                manuscriptsById={manuscriptsById}
                onSelectFolder={onSelectFolder}
                onSelectManuscript={onSelectManuscript}
                onDelete={onDelete}
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

  return (
    <li className="project-tree-node">
      <div
        className="manuscript-row project-tree-file-row"
        style={{ paddingLeft: `${depth * 0.75 + 0.5}rem` }}
      >
        <button
          type="button"
          className="manuscript-item project-tree-file"
          data-active={activeId === id ? "true" : undefined}
          onClick={() => onSelectManuscript(id)}
        >
          <div className="manuscript-item-title-row">
            <span className="project-tree-icon project-tree-icon-file" aria-hidden />
            <span className="manuscript-item-title">{manuscript?.title ?? node.name}</span>
            {gitEntry ? <GitFileStatusBadge status={gitEntry.status} /> : null}
          </div>
          {libraryViewMode === "compact" && manuscript ? (
            <div className="manuscript-item-meta">{formatCompactMeta(manuscript)}</div>
          ) : null}
          {libraryViewMode === "comfortable" && manuscript ? (
            <div className="manuscript-item-details">
              <div className="manuscript-item-meta-line">
                Edited {formatManuscriptTimestamp(manuscript.updatedAt)}
              </div>
              {formatManuscriptPath(manuscript) ? (
                <div className="manuscript-item-meta-line manuscript-item-path">
                  {formatManuscriptPath(manuscript)}
                </div>
              ) : null}
            </div>
          ) : null}
          {libraryViewMode === "grid" && manuscript ? (
            <div className="manuscript-item-details">
              <div className="manuscript-item-meta-line">
                Edited {formatManuscriptEdited(manuscript.updatedAt)}
              </div>
            </div>
          ) : null}
        </button>
        <button
          type="button"
          className="icon-btn manuscript-delete"
          aria-label={`Delete ${manuscript?.title ?? node.name}`}
          title="Delete"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(id);
          }}
        >
          <IconTrash />
        </button>
      </div>
    </li>
  );
}

function IconTrash() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
