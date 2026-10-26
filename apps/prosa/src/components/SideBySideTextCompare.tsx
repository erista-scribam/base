export interface SideBySideTextCompareProps {
  leftLabel: string;
  rightLabel: string;
  leftText: string;
  rightText: string;
  className?: string;
}

export function SideBySideTextCompare({
  leftLabel,
  rightLabel,
  leftText,
  rightText,
  className,
}: SideBySideTextCompareProps) {
  const rootClass = className ? `merge-conflict-compare ${className}` : "merge-conflict-compare";

  return (
    <div className={rootClass}>
      <div className="merge-conflict-pane">
        <h3>{leftLabel}</h3>
        <pre>{leftText || "(empty)"}</pre>
      </div>
      <div className="merge-conflict-pane merge-conflict-pane-incoming">
        <h3>{rightLabel}</h3>
        <pre>{rightText || "(empty)"}</pre>
      </div>
    </div>
  );
}
