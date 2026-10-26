/**
 * Lane assignment for a commit graph (newest-first, topo order).
 * Adapted from DevFrame's git commit-graph (SourceTree / GitHub Desktop style).
 * @see https://github.com/devframes/devframe/blob/main/plugins/git/src/client/lib/commit-graph.ts
 */

export interface GraphInput {
  hash: string;
  parents: string[];
}

export interface GraphLink {
  from: number;
  to: number;
  color: string;
}

export interface GraphRow {
  hash: string;
  col: number;
  color: string;
  topLinks: GraphLink[];
  bottomLinks: GraphLink[];
}

export interface CommitGraphLayout {
  rows: GraphRow[];
  columns: number;
}

/** VS Code / GitLens–style lane colors (stable per lane, high contrast on dark UI). */
export const GRAPH_LANE_COLORS = [
  "#a78bfa",
  "#ec4899",
  "#f59e0b",
  "#34d399",
  "#38bdf8",
  "#22d3ee",
  "#f87171",
  "#a3e635",
] as const;

export const GRAPH_LANE_WIDTH = 14;
export const GRAPH_ROW_HEIGHT = 52;
export const GRAPH_PAD_X = 6;

interface Lane {
  hash: string;
  color: string;
}

export function computeCommitGraph(commits: GraphInput[]): CommitGraphLayout {
  const lanes: (Lane | null)[] = [];
  let colorIndex = 0;
  const nextColor = () => GRAPH_LANE_COLORS[colorIndex++ % GRAPH_LANE_COLORS.length]!;
  const firstFree = () => {
    const index = lanes.indexOf(null);
    return index === -1 ? lanes.length : index;
  };

  const rows: GraphRow[] = [];

  for (const commit of commits) {
    const { hash } = commit;
    const parents = commit.parents.filter(Boolean);

    const incoming: { col: number; hash: string; color: string }[] = [];
    for (let k = 0; k < lanes.length; k += 1) {
      const lane = lanes[k];
      if (lane) {
        incoming.push({ col: k, hash: lane.hash, color: lane.color });
      }
    }

    let col = lanes.findIndex((lane) => lane?.hash === hash);
    let color: string;
    if (col === -1) {
      col = firstFree();
      color = nextColor();
    } else {
      color = lanes[col]!.color;
    }

    for (let k = 0; k < lanes.length; k += 1) {
      if (lanes[k]?.hash === hash) {
        lanes[k] = null;
      }
    }
    lanes[col] = null;

    const parentCols: { col: number; color: string }[] = [];
    parents.forEach((parent, index) => {
      if (index === 0) {
        lanes[col] = { hash: parent, color };
        parentCols.push({ col, color });
        return;
      }
      let parentCol = lanes.findIndex((lane) => lane?.hash === parent);
      if (parentCol === -1) {
        parentCol = firstFree();
        lanes[parentCol] = { hash: parent, color: nextColor() };
      }
      parentCols.push({ col: parentCol, color: lanes[parentCol]!.color });
    });
    if (parents.length === 0) {
      lanes[col] = null;
    }

    while (lanes.length > 0 && lanes[lanes.length - 1] == null) {
      lanes.pop();
    }

    const topLinks: GraphLink[] = incoming.map((lane) => ({
      from: lane.col,
      to: lane.hash === hash ? col : lane.col,
      color: lane.color,
    }));

    const bottomLinks: GraphLink[] = [];
    for (const lane of incoming) {
      if (lane.hash !== hash) {
        bottomLinks.push({ from: lane.col, to: lane.col, color: lane.color });
      }
    }
    for (const parent of parentCols) {
      bottomLinks.push({ from: col, to: parent.col, color: parent.color });
    }

    rows.push({ hash, col, color, topLinks, bottomLinks });
  }

  let columns = 1;
  for (const row of rows) {
    columns = Math.max(columns, row.col + 1);
    for (const link of row.topLinks) {
      columns = Math.max(columns, link.from + 1, link.to + 1);
    }
    for (const link of row.bottomLinks) {
      columns = Math.max(columns, link.from + 1, link.to + 1);
    }
  }

  return { rows, columns };
}

export function laneCenterX(col: number): number {
  return GRAPH_PAD_X + col * GRAPH_LANE_WIDTH + GRAPH_LANE_WIDTH / 2;
}

export function linkPath(fromCol: number, toCol: number, yStart: number, yEnd: number): string {
  const x1 = laneCenterX(fromCol);
  const x2 = laneCenterX(toCol);
  const y1 = yStart;
  const y2 = yEnd;
  if (fromCol === toCol) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
}

export function graphGutterWidth(columns: number): number {
  return GRAPH_PAD_X * 2 + columns * GRAPH_LANE_WIDTH;
}
