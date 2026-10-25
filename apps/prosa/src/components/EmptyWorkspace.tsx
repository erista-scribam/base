export interface EmptyWorkspaceProps {
  onCreate: () => void;
}

export function EmptyWorkspace({ onCreate }: EmptyWorkspaceProps) {
  return (
    <div className="workspace-empty">
      <p className="workspace-empty-title">Your writing desk</p>
      <p className="workspace-empty-hint">
        Choose a manuscript from the sidebar, or start a new one. The page stays quiet while you
        work.
      </p>
      <button type="button" className="text-btn" onClick={onCreate}>
        New manuscript
      </button>
    </div>
  );
}
