import { useMemo, type CSSProperties } from "react";
import type { GitGraphCommit } from "../../features/version-control/project-version-control";
import {
  GRAPH_ROW_HEIGHT,
  computeCommitGraph,
  graphGutterWidth,
  laneCenterX,
  linkPath,
} from "../../features/version-control/commit-graph-layout";

export interface CommitGraphViewProps {
  commits: GitGraphCommit[];
  currentBranch: string;
}

function formatCommitTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function branchColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const palette = [
    "#a78bfa",
    "#ec4899",
    "#f59e0b",
    "#34d399",
    "#38bdf8",
    "#22d3ee",
    "#f87171",
    "#a3e635",
  ];
  return palette[hash % palette.length]!;
}

export function CommitGraphView({ commits, currentBranch }: CommitGraphViewProps) {
  const byId = useMemo(() => new Map(commits.map((commit) => [commit.id, commit])), [commits]);

  const layout = useMemo(
    () =>
      computeCommitGraph(
        commits.map((commit) => ({
          hash: commit.id,
          parents: commit.parentIds,
        })),
      ),
    [commits],
  );

  const gutterWidth = graphGutterWidth(layout.columns);
  const midY = GRAPH_ROW_HEIGHT / 2;

  if (commits.length === 0) {
    return <p className="commit-graph-empty">Commit to create your first graph node.</p>;
  }

  return (
    <div className="commit-graph" aria-label="Commit graph">
      <ol className="commit-graph-list">
        {layout.rows.map((row) => {
          const commit = byId.get(row.hash);
          if (!commit) {
            return null;
          }
          const isHead = commit.branchTips.includes(currentBranch);
          return (
            <li key={row.hash} className="commit-graph-item" style={{ height: GRAPH_ROW_HEIGHT }}>
              <svg
                className="commit-graph-gutter"
                width={gutterWidth}
                height={GRAPH_ROW_HEIGHT}
                aria-hidden
              >
                {row.topLinks.map((link, index) => (
                  <path
                    key={`t-${index}`}
                    className="commit-graph-line"
                    d={linkPath(link.from, link.to, 0, midY)}
                    stroke={link.color}
                  />
                ))}
                {row.bottomLinks.map((link, index) => (
                  <path
                    key={`b-${index}`}
                    className="commit-graph-line"
                    d={linkPath(link.from, link.to, midY, GRAPH_ROW_HEIGHT)}
                    stroke={link.color}
                  />
                ))}
                <circle
                  className="commit-graph-node"
                  cx={laneCenterX(row.col)}
                  cy={midY}
                  r={5}
                  fill={row.color}
                  stroke={row.color}
                  strokeWidth={2}
                />
                {isHead ? (
                  <circle
                    className="commit-graph-node-head"
                    cx={laneCenterX(row.col)}
                    cy={midY}
                    r={7}
                    fill="none"
                    stroke={row.color}
                    strokeWidth={1.5}
                  />
                ) : null}
              </svg>
              <div className="commit-graph-body">
                <div className="commit-graph-summary-row">
                  {commit.branchTips.map((name) => {
                    const color = branchColor(name);
                    return (
                      <span
                        key={name}
                        className="commit-graph-branch"
                        data-current={name === currentBranch ? "true" : undefined}
                        style={
                          {
                            "--commit-graph-branch-color": color,
                          } as CSSProperties
                        }
                      >
                        {name}
                      </span>
                    );
                  })}
                  <span className="commit-graph-summary">{commit.message || "Checkpoint"}</span>
                </div>
                <div className="commit-graph-meta">
                  <code>{commit.shortId}</code>
                  <span>{formatCommitTime(commit.committedAt)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
