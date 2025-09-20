import { useState, type ReactNode, type CSSProperties } from "react";

export function Disclosure({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const wrap: CSSProperties = {
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    overflow: "hidden",
    background: "var(--color-bg)",
  };
  const head: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px",
    cursor: "pointer",
    userSelect: "none",
    background: "var(--color-primary)",
    borderBottom: open ? "1px solid var(--color-border)" : undefined,
  };
  const body: CSSProperties = { padding: 8 };
  return (
    <div style={wrap}>
      <div style={head} onClick={() => setOpen(!open)}>
        <div style={{ color: "var(--color-primary-text)", fontWeight: 600 }}>
          {title}
        </div>
        <div style={{ color: "var(--color-text-muted)" }}>
          {open ? "▾" : "▸"}
        </div>
      </div>
      {open ? <div style={body}>{children}</div> : null}
    </div>
  );
}
