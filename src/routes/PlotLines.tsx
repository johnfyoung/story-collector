import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { useStories } from "../state/StoriesProvider";
import { TabNav } from "../components/TabNav";
import { SearchBox } from "../components/SearchBox";
import type { PlotLine, StoryContent } from "../types";

type SortBy = 'alphabetical' | 'lastUpdated' | 'none'

export default function PlotLines() {
  const { id: storyId } = useParams();
  const navigate = useNavigate();
  const { loadContent } = useStories();
  const [content, setContent] = useState<StoryContent | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>('lastUpdated');

  useEffect(() => {
    if (!storyId) return;
    loadContent(storyId).then(setContent);
  }, [storyId, loadContent]);

  const filtered = useMemo(() => {
    if (!content) return [] as PlotLine[];
    const q = query.toLowerCase();
    let results = content.plotLines.filter(
      (pl) =>
        pl.title.toLowerCase().includes(q) ||
        (pl.description ?? "").toLowerCase().includes(q)
    );

    // Sort results
    if (sortBy === 'alphabetical') {
      results = results.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'lastUpdated') {
      results = results.sort((a, b) => (b.lastEdited ?? 0) - (a.lastEdited ?? 0));
    }

    return results;
  }, [content, query, sortBy]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {storyId ? <TabNav active="plot-lines" storyId={storyId} /> : null}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, color: "var(--color-text)" }}>Plot lines</h1>
        {storyId ? (
          <a
            href={`/stories/${storyId}/plot-lines/new`}
            style={{ textDecoration: "none" }}
          >
            <Button>Add plot line</Button>
          </a>
        ) : null}
      </div>
      {!content ? (
        <div style={{ color: "var(--color-text)" }}>Loading…</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <SearchBox
                value={query}
                onChange={setQuery}
                suggestions={content.plotLines.map((pl) => pl.title)}
                placeholder="Search plot lines…"
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
          {filtered.length === 0 ? (
            <Card>
              <div style={{ color: "var(--color-text-muted)" }}>
                No plot lines match.
              </div>
            </Card>
          ) : (
            filtered.map((pl) => (
              <Card
                key={pl.id}
                onClick={() =>
                  storyId &&
                  navigate(`/stories/${storyId}/plot-lines/${pl.id}/edit`)
                }
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{ color: "var(--color-text)", fontWeight: 600 }}
                    >
                      {pl.title}
                    </div>
                    {pl.description ? (
                      <div
                        style={{
                          color: "var(--color-text-muted)",
                          marginTop: 4,
                        }}
                      >
                        {pl.description}
                      </div>
                    ) : null}
                    <div
                      style={{
                        color: "var(--color-text-muted)",
                        marginTop: 8,
                        fontSize: "var(--font-sm)",
                      }}
                    >
                      {pl.chapters.length} chapter{pl.chapters.length !== 1 ? 's' : ''}
                      {' • '}
                      {pl.chapters.reduce((sum, ch) => sum + ch.plotPoints.length, 0)} plot point{pl.chapters.reduce((sum, ch) => sum + ch.plotPoints.length, 0) !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {storyId ? (
                    <a
                      href={`/stories/${storyId}/plot-lines/${pl.id}/edit`}
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
