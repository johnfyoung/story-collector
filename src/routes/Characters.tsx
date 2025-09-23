import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { useStories } from "../state/StoriesProvider";
import { TabNav } from "../components/TabNav";
import { SearchBox } from "../components/SearchBox";
import { Avatar } from "../components/Avatar";
import type { Character, StoryContent } from "../types";

export default function Characters() {
  const { id: storyId } = useParams();
  const navigate = useNavigate();
  const { loadContent } = useStories();
  const [content, setContent] = useState<StoryContent | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!storyId) return;
    loadContent(storyId).then(setContent);
  }, [storyId, loadContent]);

  // const elementsIndex = useMemo(() => {
  //   const idx: string[] = [];
  //   if (!content) return idx;
  //   for (const c of content.characters) if (c.name) idx.push(c.name);
  //   for (const s of content.species) if (s.name) idx.push(s.name);
  //   for (const p of content.locations) if (p.name) idx.push(p.name);
  //   for (const i of content.items) if (i.name) idx.push(i.name);
  //   for (const g of content.groups) if (g.name) idx.push(g.name);
  //   for (const l of content.languages) if (l.name) idx.push(l.name);
  //   for (const pl of content.plotPoints) if (pl.title) idx.push(pl.title);
  //   return idx;
  // }, [content]);

  const filtered = useMemo(() => {
    if (!content) return [] as Character[];
    const q = query.toLowerCase();
    return content.characters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.shortDescription ?? "").toLowerCase().includes(q)
    );
  }, [content, query]);

  function startAdd() {}

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {storyId ? <TabNav active="characters" storyId={storyId} /> : null}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, color: "var(--color-text)" }}>Characters</h1>
        {storyId ? (
          <a
            href={`/stories/${storyId}/characters/new`}
            style={{ textDecoration: "none" }}
          >
            <Button onClick={startAdd}>Add character</Button>
          </a>
        ) : null}
      </div>
      {!content ? (
        <div style={{ color: "var(--color-text)" }}>Loading…</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          <SearchBox
            value={query}
            onChange={setQuery}
            suggestions={content.characters.map((c) => c.name)}
            placeholder="Search characters…"
          />
          {filtered.length === 0 ? (
            <Card>
              <div style={{ color: "var(--color-text-muted)" }}>
                No characters match.
              </div>
            </Card>
          ) : (
            filtered.map((c) => (
              <Card
                key={c.id}
                onClick={() =>
                  storyId &&
                  navigate(`/stories/${storyId}/characters/${c.id}/edit`)
                }
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <Avatar
                      name={c.name}
                      url={c.avatarUrl}
                      size={40}
                      editable={false}
                      onChange={() => {
                        /* no-op in list */
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{ color: "var(--color-text)", fontWeight: 600 }}
                      >
                        {c.name}
                      </div>
                      {c.shortDescription ? (
                        <div
                          style={{
                            color: "var(--color-text-muted)",
                            marginTop: 4,
                          }}
                        >
                          {c.shortDescription}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {storyId ? (
                    <a
                      href={`/stories/${storyId}/characters/${c.id}/edit`}
                      style={{ textDecoration: "none" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost">Edit</Button>
                    </a>
                  ) : null}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// MentionArea moved to shared component: src/components/MentionArea.tsx
