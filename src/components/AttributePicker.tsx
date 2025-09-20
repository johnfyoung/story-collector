import { useMemo, useState } from "react";
import type { DescriptorKey } from "../types";

export type AttrMeta = { key: DescriptorKey; label: string };

export function AttributePicker({
  categories,
  chosenKeys,
  onAdd,
}: {
  categories: { title: string; items: AttrMeta[] }[];
  chosenKeys: DescriptorKey[];
  onAdd: (key: DescriptorKey) => void;
}) {
  const [query, setQuery] = useState("");
  const [browseOpen, setBrowseOpen] = useState(false);
  const [activeCat, setActiveCat] = useState(0);
  const chosen = useMemo(
    () => new Set<DescriptorKey>(chosenKeys),
    [chosenKeys]
  );
  const allItems = useMemo(
    () =>
      categories.flatMap((c, ci) =>
        c.items.map((it) => ({ ...it, category: categories[ci].title }))
      ),
    [categories]
  );
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as Array<AttrMeta & { category: string }>;
    return allItems
      .filter((it) => it.label.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, allItems]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="Search attributes…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-bg)",
            color: "var(--color-text)",
          }}
        />
        <button
          type="button"
          onClick={() => setBrowseOpen((o) => !o)}
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-surface)",
            color: "var(--color-text)",
            padding: "10px 12px",
            cursor: "pointer",
          }}
        >
          Browse…
        </button>
      </div>
      {suggestions.length > 0 ? (
        <div
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-bg)",
          }}
        >
          {suggestions.map((s) => (
            <div
              key={s.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 8px",
                cursor: chosen.has(s.key) ? "not-allowed" : "pointer",
                opacity: chosen.has(s.key) ? 0.6 : 1,
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                if (!chosen.has(s.key)) onAdd(s.key);
              }}
            >
              <div style={{ color: "var(--color-text)" }}>{s.label}</div>
              <div style={{ color: "var(--color-text-muted)" }}>
                {s.category}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {browseOpen ? (
        <div
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
            }}
          >
            {categories.map((c, i) => (
              <button
                key={c.title}
                type="button"
                onClick={() => setActiveCat(i)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  background:
                    i === activeCat ? "var(--color-bg-white)" : "transparent",
                  border: "none",
                  borderBottom:
                    i === activeCat ? "none" : "1px solid var(--color-border)",
                  borderRight:
                    i < categories.length - 1
                      ? "1px solid var(--color-border)"
                      : "none",
                  cursor: "pointer",
                  color: "var(--color-text-black)",
                }}
              >
                {c.title}
              </button>
            ))}
          </div>
          <div
            style={{
              padding: 8,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              background: "var(--color-bg-white)",
            }}
          >
            {categories[activeCat].items.map((it) => (
              <button
                key={it.key}
                type="button"
                onClick={() => onAdd(it.key)}
                disabled={chosen.has(it.key)}
                style={{
                  border: "1px dashed var(--color-border)",
                  padding: "6px 10px",
                  background: "transparent",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-text-black)",
                  cursor: chosen.has(it.key) ? "not-allowed" : "pointer",
                  opacity: chosen.has(it.key) ? 0.6 : 1,
                }}
              >
                + {it.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
