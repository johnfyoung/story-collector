import { forwardRef, type TextareaHTMLAttributes, type CSSProperties } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  maxChars?: number;
};

export const TextArea = forwardRef<HTMLTextAreaElement, Props>(
  function TextArea({ label, maxChars, value, onChange, style, ...rest }, ref) {
    const text = typeof value === "string" ? value : "";
    const remaining = maxChars
      ? Math.max(0, maxChars - text.length)
      : undefined;

    const base: CSSProperties = {
      width: "100%",
      padding: "10px 12px",
      boxSizing: "border-box",
      background: "var(--color-bg-white)",
      font: "inherit",
      lineHeight: "inherit",
      color: "var(--color-text-black)",
      borderRadius: "var(--radius-sm)",
      border: "1px solid var(--color-border)",
      outline: "none",
      minHeight: 96,
    };
    const labelStyle: CSSProperties = {
      display: "block",
      marginBottom: 6,
      color: "var(--color-text)",
      fontSize: "var(--font-md)",
    };

    return (
      <label style={{ display: "block" }}>
        {label ? <span style={labelStyle}>{label}</span> : null}
        <textarea
          ref={ref}
          value={value}
          onChange={onChange}
          style={{ ...base, ...style }}
          {...rest}
        />
        {maxChars != null ? (
          <div
            style={{
              marginTop: 6,
              color: "var(--color-text-muted)",
              fontSize: "var(--font-sm)",
              textAlign: "right",
            }}
          >
            {remaining} characters left
          </div>
        ) : null}
      </label>
    );
  }
);
