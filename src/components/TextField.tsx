import { forwardRef, type InputHTMLAttributes, type CSSProperties } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, hint, style, ...rest },
  ref
) {
  const baseInput: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: "var(--color-bg-white)",
    font: "inherit",
    lineHeight: "inherit",
    color: "var(--color-text-black)",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--color-border)",
    outline: "none",
  };
  const labelStyle: CSSProperties = {
    display: "block",
    marginBottom: 6,
    color: "var(--color-text)",
    fontSize: "var(--font-md)",
  };
  const hintStyle: CSSProperties = {
    marginTop: 6,
    color: "var(--color-text-muted)",
    fontSize: "var(--font-sm)",
  };
  return (
    <label style={{ display: "block" }}>
      {label ? <span style={labelStyle}>{label}</span> : null}
      <input ref={ref} {...rest} style={{ ...baseInput, ...style }} />
      {hint ? <div style={hintStyle}>{hint}</div> : null}
    </label>
  );
});
