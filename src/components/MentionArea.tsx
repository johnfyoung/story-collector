import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

export function MentionArea({
  value,
  onChange,
  suggestions,
  label,
  maxChars,
  minHeight,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  label?: string;
  maxChars?: number;
  minHeight?: number;
}) {
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState("");
  const [caret, setCaret] = useState(0);
  const [selected, setSelected] = useState(0);

  const matches = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return [];
    return suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 8);
  }, [query, suggestions]);

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const raw = e.currentTarget.value;
    const val = typeof maxChars === "number" ? raw.slice(0, maxChars) : raw;
    const pos = e.currentTarget.selectionStart ?? val.length;
    onChange(val);
    setCaret(pos);
    updateMentionState(val, pos);
    setSelected(0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!show || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(matches[selected]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShow(false);
    }
  }

  function updateMentionState(val: string, pos: number) {
    const left = val.slice(0, pos);
    const at = left.lastIndexOf("@");
    if (at >= 0) {
      const token = left.slice(at + 1);
      if (/^[A-Za-z0-9 _-]{0,50}$/.test(token)) {
        setShow(true);
        setQuery(token.trimStart());
        return;
      }
    }
    setShow(false);
    setQuery("");
  }

  function insertMention(text: string) {
    const before = value.slice(0, caret);
    const at = before.lastIndexOf("@");
    if (at < 0) return;
    const after = value.slice(caret);
    const prefix = value.slice(0, at);
    const inserted = `${prefix}@${text} `;
    const next = inserted + after;
    onChange(next);
    // move caret to the end of the inserted mention + space
    const newPos = inserted.length;
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(newPos, newPos);
      }
    });
    setCaret(newPos);
    setShow(false);
    setQuery("");
    setSelected(0);
  }

  // highlight overlay

  // Improved matcher: multi-word mentions that end before next whitespace/end
  const highlightHtml = useMemo(() => {
    const escape = (s: string) =>
      s.replace(
        /[&<>\"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          }[c]!)
      );
    const esc = escape(value);
    const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const toks = Array.from(
      new Set((suggestions || []).map((s) => s.trim()).filter(Boolean))
    ).sort((a, b) => b.length - a.length);

    let html: string;
    if (toks.length > 0) {
      const pattern = new RegExp(
        `@(${toks.map(escRe).join("|")})(?=\\s|$|[^A-Za-z0-9_-])`,
        "g"
      );
      html =
        esc.replace(
          pattern,
          (_m, p1) =>
            `<span class="mention-at">@</span><span class="mention-chip">${p1}</span>`
        ) || "&nbsp;";
    } else {
      const pattern =
        /@([A-Za-z0-9_-]+(?: [A-Za-z0-9_-]+)*)(?=\s|$|[^A-Za-z0-9_-])/g;
      html =
        esc.replace(
          pattern,
          (_m, p1) =>
            `<span class="mention-at">@</span><span class="mention-chip">${p1}</span>`
        ) || "&nbsp;";
    }
    return html;
  }, [value, suggestions]);

  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // keep overlay scroll in sync on value changes
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, [value]);

  return (
    <label style={{ display: "block" }}>
      {label ? (
        <span
          style={{
            display: "block",
            marginBottom: 6,
            color: "var(--color-text)",
            fontSize: "var(--font-md)",
          }}
        >
          {label}
        </span>
      ) : null}
      <div ref={containerRef} style={{ position: "relative" }}>
        <div
          ref={overlayRef}
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            padding: "10px 12px",
            boxSizing: "border-box",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            overflow: "hidden",
            color: "var(--color-text-black)",
            background: "var(--color-bg-white)",
            font: "inherit",
            lineHeight: "inherit",
            pointerEvents: "none",
            borderRadius: "var(--radius-sm)",
            border: "1px solid transparent",
            zIndex: 0,
          }}
          dangerouslySetInnerHTML={{ __html: highlightHtml }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={(e) => {
            if (overlayRef.current) {
              overlayRef.current.scrollTop = e.currentTarget.scrollTop;
              overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
          style={{
            width: "100%",
            padding: "10px 12px",
            boxSizing: "border-box",
            background: "transparent",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            caretColor: "var(--color-text)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
            outline: "none",
            minHeight: typeof minHeight === "number" ? minHeight : 96,
            position: "relative",
            zIndex: 1,
            font: "inherit",
            lineHeight: "inherit",
          }}
        />
        {show && matches.length > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "100%",
              zIndex: 20,
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-bg)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            {matches.map((m, i) => (
              <div
                key={m}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(m);
                }}
                style={{
                  padding: "6px 8px",
                  cursor: "pointer",
                  color: "var(--color-text)",
                  background:
                    i === selected ? "var(--color-surface)" : "transparent",
                }}
              >
                {m}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {maxChars != null ? (
        <div
          style={{
            marginTop: 6,
            color: "var(--color-text-muted)",
            fontSize: "var(--font-sm)",
            textAlign: "right",
          }}
        >
          {Math.max(0, maxChars - (value?.length ?? 0))} characters left
        </div>
      ) : null}
      {/* Inline style for chips */}
      <style>{`
        .mention-at{ visibility: hidden; }
        .mention-chip{ position: relative; display:inline; border-radius: 999px; }
        .mention-chip::before{ content:""; position:absolute; left:-6px; right:-2px; top:-2px; bottom:-2px; background: rgba(37,99,235,0.15); border-radius: inherit; pointer-events:none; }
      `}</style>
    </label>
  );
}
