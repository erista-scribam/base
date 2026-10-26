import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ManuscriptSummary } from "@scribo/core";
import type { GitChangedFile } from "../features/version-control/project-version-control";
import { gitStatusForManuscriptPath } from "../features/version-control/git-file-status";
import {
  buildProjectTree,
  listProjectTree,
  type ProjectTreeNode,
} from "../features/projects/project-tree";
import { GitFileStatusBadge } from "./GitFileStatusBadge";

/** Horizontal inset per tree level (px), matched in CSS via the same calc. */
const TREE_INDENT_PX = 12;
const TREE_BASE_PADDING_PX = 6;

export interface ProjectFilesExplorerProps {
  refreshKey: number;
  activeId: string | null;
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
    <ul className="project-tree" role="tree">
      {tree.map((node) => (
        <TreeNodeRow
          key={node.relativePath}
          node={node}
          depth={0}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          activeId={activeId}
          selectedFolderPath={selectedFolderPath}
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

function treePadding(depth: number): CSSProperties {
  return { paddingLeft: `${TREE_BASE_PADDING_PX + depth * TREE_INDENT_PX}px` };
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
  onDelete,
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
  onDelete: (id: string) => void;
}) {
  const isFolder = node.kind === "folder";
  const isCollapsed = isFolder && collapsed.has(node.relativePath);
  const manuscript = node.manuscriptId ? manuscriptsById.get(node.manuscriptId) : undefined;
  const gitEntry = gitStatusForManuscriptPath(node.relativePath, changedFiles);

  if (isFolder) {
    return (
      <li className="project-tree-node" role="treeitem" aria-expanded={!isCollapsed}>
        <div className="project-tree-row" style={treePadding(depth)}>
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
        {!isCollapsed && node.children.length > 0 ? (
          <ul className="project-tree-children" role="group">
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

  const label = node.name;

  return (
    <li className="project-tree-node" role="treeitem">
      <div className="project-tree-row project-tree-row-file" style={treePadding(depth)}>
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
        <button
          type="button"
          className="project-tree-action"
          aria-label={`Delete ${label}`}
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

function IconTrash() {
  return (
    <svg
      width="12"
      height="12"
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
