import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
  children: ReactNode;
}

export function IconButton({ label, active, children, className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={className ?? "icon-btn"}
      aria-label={label}
      title={label}
      data-active={active ? "true" : undefined}
      {...props}
    >
      {children}
    </button>
  );
}
