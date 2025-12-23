import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { SearchBox } from "../components/SearchBox";
import { Avatar } from "../components/Avatar";
import { useStories } from "../state/StoriesProvider";
import { TabNav } from "../components/TabNav";
import type { NamedElement, StoryContent } from "../types";

type SortBy = 'alphabetical' | 'lastUpdated' | 'none'

export default function Locations() {
  const { id: storyId } = useParams();
  const navigate = useNavigate();
  const { loadContent, saveContent } = useStories();
  const [content, setContent] = useState<StoryContent | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>('lastUpdated');

  useEffect(() => {
    if (!storyId) return;
    loadContent(storyId).then(setContent);
  }, [storyId, loadContent]);

  // const suggestions = useMemo(() => {
  //   if (!content) return [] as string[];
  //   const idx: string[] = [];
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
    if (!content) return [] as NamedElement[];
    const q = query.toLowerCase();
    let results = content.locations.filter(
      (el) =>
        el.name.toLowerCase().includes(q) ||
        (el.shortDescription ?? "").toLowerCase().includes(q)
    );

    // Sort results
    if (sortBy === 'alphabetical') {
      results = results.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'lastUpdated') {
      results = results.sort((a, b) => (b.lastEdited ?? 0) - (a.lastEdited ?? 0));
    }

    return results;
  }, [content, query, sortBy]);

  async function remove(id: string) {
    if (!storyId || !content) return;
    const ok = confirm("Delete this location?");
    if (!ok) return;
    const next: StoryContent = {
      ...content,
      locations: content.locations.filter((x) => x.id !== id),
    };
    await saveContent(storyId, next);
    setContent(next);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {storyId ? <TabNav active="locations" storyId={storyId} /> : null}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, color: "var(--color-text)" }}>Locations</h1>
        {storyId ? (
          <a
            href={`/stories/${storyId}/locations/new`}
            style={{ textDecoration: "none" }}
          >
            <Button>Add location</Button>
          </a>
        ) : null}
      </div>
      {content ? (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchBox
              value={query}
              onChange={setQuery}
              suggestions={content.locations.map((e) => e.name)}
              placeholder="Search locations…"
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant={sortBy === 'alphabetical' ? 'primary' : 'ghost'}
              onClick={() => setSortBy(sortBy === 'alphabetical' ? 'none' : 'alphabetical')}
            >
              A-Z
            </Button>
            <Button
              variant={sortBy === 'lastUpdated' ? 'primary' : 'ghost'}
              onClick={() => setSortBy(sortBy === 'lastUpdated' ? 'none' : 'lastUpdated')}
            >
              Recently Updated
            </Button>
          </div>
        </div>
      ) : null}
      {!content ? (
        <div style={{ color: "var(--color-text)" }}>Loading…</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.length === 0 ? (
            <Card>
              <div style={{ color: "var(--color-text-muted)" }}>
                No locations match.
              </div>
            </Card>
          ) : (
            filtered.map((el) => (
              <Card
                key={el.id}
                onClick={() =>
                  storyId &&
                  navigate(`/stories/${storyId}/locations/${el.id}/edit`)
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
                      name={el.name}
                      url={el.avatarUrl}
                      size={40}
                      editable={false}
                      onChange={() => {}}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{ color: "var(--color-text)", fontWeight: 600 }}
                      >
                        {el.name}
                      </div>
                      {el.shortDescription ? (
                        <div
                          style={{
                            color: "var(--color-text-muted)",
                            marginTop: 4,
                          }}
                        >
                          {el.shortDescription}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {storyId ? (
                      <a
                        href={`/stories/${storyId}/locations/${el.id}/edit`}
                        style={{ textDecoration: "none" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost">Edit</Button>
                      </a>
                    ) : null}
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(el.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
