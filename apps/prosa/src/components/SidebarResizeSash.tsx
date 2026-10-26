import { useCallback, useRef, type PointerEvent } from "react";

export interface SidebarResizeSashProps {
  orientation: "horizontal" | "vertical";
  ariaLabel: string;
  onDelta: (deltaPx: number) => void;
  className?: string;
}

export function SidebarResizeSash({
  orientation,
  ariaLabel,
  onDelta,
  className,
}: SidebarResizeSashProps) {
  const draggingRef = useRef(false);
  const lastPosRef = useRef(0);

  const endDrag = useCallback(() => {
    draggingRef.current = false;
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
  }, []);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      draggingRef.current = true;
      lastPosRef.current = orientation === "horizontal" ? event.clientY : event.clientX;
      document.body.style.cursor = orientation === "horizontal" ? "row-resize" : "col-resize";
      document.body.style.userSelect = "none";
    },
    [orientation],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) {
        return;
      }
      const pos = orientation === "horizontal" ? event.clientY : event.clientX;
      const delta = pos - lastPosRef.current;
      lastPosRef.current = pos;
      if (delta !== 0) {
        onDelta(delta);
      }
    },
    [onDelta, orientation],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      endDrag();
    },
    [endDrag],
  );

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      aria-label={ariaLabel}
      className={`sidebar-sash sidebar-sash-${orientation}${className ? ` ${className}` : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={endDrag}
    />
  );
}
