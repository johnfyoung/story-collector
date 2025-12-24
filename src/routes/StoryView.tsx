import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { IconButton } from "../components/IconButton";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Scale } from "../components/Scale";
import { TextArea } from "../components/TextArea";
import { useStories } from "../state/StoriesProvider";
import type { AuthorStyleScales } from "../types";
import type { CSSProperties } from "react";

export default function StoryView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, remove, loadContent, update } = useStories();
  const story = id ? get(id) : undefined;
  const [isEditingStyle, setIsEditingStyle] = useState(false);
  const [styleVoice, setStyleVoice] = useState("");
  const [stylePersonality, setStylePersonality] = useState("");
  const [styleNotes, setStyleNotes] = useState("");
  const [styleScales, setStyleScales] = useState<AuthorStyleScales>({});

  useEffect(() => {
    if (!story || isEditingStyle) return;
    setStyleVoice(story.authorStyle?.voice ?? "");
    setStylePersonality(story.authorStyle?.personality ?? "");
    setStyleNotes(story.authorStyle?.styleNotes ?? "");
    setStyleScales({
      formality: story.authorStyle?.scales?.formality,
      descriptiveness: story.authorStyle?.scales?.descriptiveness,
      pacing: story.authorStyle?.scales?.pacing,
      dialogueFocus: story.authorStyle?.scales?.dialogueFocus,
      emotionalIntensity: story.authorStyle?.scales?.emotionalIntensity,
      humor: story.authorStyle?.scales?.humor,
      darkness: story.authorStyle?.scales?.darkness,
    });
  }, [story, isEditingStyle]);

  const buildAuthorStyle = () => {
    const voice = styleVoice.trim();
    const personality = stylePersonality.trim();
    const notes = styleNotes.trim();
    const scales = Object.entries(styleScales).reduce((acc, [key, value]) => {
      const numeric =
        typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
      if (Number.isFinite(numeric) && numeric > 0) {
        acc[key as keyof AuthorStyleScales] = numeric;
      }
      return acc;
    }, {} as AuthorStyleScales);
    const hasScales = Object.keys(scales).length > 0;

    if (!voice && !personality && !notes && !hasScales) return undefined;
    return {
      voice: voice || undefined,
      personality: personality || undefined,
      styleNotes: notes || undefined,
      scales: hasScales ? scales : undefined,
    };
  };

  const handleStyleSave = () => {
    if (!story) return;
    update(story.id, { authorStyle: buildAuthorStyle() });
    setIsEditingStyle(false);
  };

  const handleStyleCancel = () => {
    if (!story) return;
    setStyleVoice(story.authorStyle?.voice ?? "");
    setStylePersonality(story.authorStyle?.personality ?? "");
    setStyleNotes(story.authorStyle?.styleNotes ?? "");
    setStyleScales({
      formality: story.authorStyle?.scales?.formality,
      descriptiveness: story.authorStyle?.scales?.descriptiveness,
      pacing: story.authorStyle?.scales?.pacing,
      dialogueFocus: story.authorStyle?.scales?.dialogueFocus,
      emotionalIntensity: story.authorStyle?.scales?.emotionalIntensity,
      humor: story.authorStyle?.scales?.humor,
      darkness: story.authorStyle?.scales?.darkness,
    });
    setIsEditingStyle(false);
  };

  const handleExport = async () => {
    if (!id || !story) return;

    try {
      const content = await loadContent(id);
      const jsonString = JSON.stringify(content, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${story.name
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export story", error);
      alert("Failed to export story");
    }
  };

  if (!story) {
    return <div style={{ color: "var(--color-text)" }}>Story not found.</div>;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0, color: "var(--color-text)" }}>{story.name}</h1>
        <IconButton
          aria-label="Edit story"
          onClick={() => navigate(`/stories/${story.id}/edit`)}
          title="Edit"
        >
          ✏️
        </IconButton>
        <button
          onClick={handleExport}
          style={{
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 10px",
            color: "var(--color-text)",
            cursor: "pointer",
          }}
          title="Export story as JSON"
        >
          Export JSON
        </button>
        <button
          onClick={async () => {
            if (!id) return;
            const ok = confirm("Delete this story? This cannot be undone.");
            if (!ok) return;
            try {
              await remove(id);
              navigate("/");
            } catch (error) {
              console.error("Failed to delete story", error);
              alert("Failed to delete story");
            }
          }}
          style={{
            marginLeft: 8,
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 10px",
            color: "crimson",
            cursor: "pointer",
          }}
        >
          Delete
        </button>
      </div>
      <div style={{ color: "var(--color-text-muted)" }}>
        {story.shortDescription}
      </div>
      <Card>
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ color: "var(--color-text)", fontWeight: 600 }}>
              Author style
            </div>
            <Button
              variant="ghost"
              onClick={() => setIsEditingStyle((prev) => !prev)}
            >
              {isEditingStyle ? "Close" : "Edit"}
            </Button>
          </div>
          {isEditingStyle ? (
            <div style={{ display: "grid", gap: 12 }}>
              <TextArea
                label="Voice"
                value={styleVoice}
                onChange={(event) => setStyleVoice(event.currentTarget.value)}
                rows={3}
              />
              <TextArea
                label="Personality"
                value={stylePersonality}
                onChange={(event) =>
                  setStylePersonality(event.currentTarget.value)
                }
                rows={3}
              />
              <TextArea
                label="Style notes"
                value={styleNotes}
                onChange={(event) => setStyleNotes(event.currentTarget.value)}
                rows={3}
              />
              <div style={{ display: "grid", gap: 12 }}>
                <Scale
                  label="Formality"
                  max={10}
                  value={styleScales.formality}
                  onChange={(value) =>
                    setStyleScales((prev) => ({ ...prev, formality: value }))
                  }
                />
                <Scale
                  label="Descriptiveness"
                  max={10}
                  value={styleScales.descriptiveness}
                  onChange={(value) =>
                    setStyleScales((prev) => ({
                      ...prev,
                      descriptiveness: value,
                    }))
                  }
                />
                <Scale
                  label="Pacing"
                  max={10}
                  value={styleScales.pacing}
                  onChange={(value) =>
                    setStyleScales((prev) => ({ ...prev, pacing: value }))
                  }
                />
                <Scale
                  label="Dialogue focus"
                  max={10}
                  value={styleScales.dialogueFocus}
                  onChange={(value) =>
                    setStyleScales((prev) => ({
                      ...prev,
                      dialogueFocus: value,
                    }))
                  }
                />
                <Scale
                  label="Emotional intensity"
                  max={10}
                  value={styleScales.emotionalIntensity}
                  onChange={(value) =>
                    setStyleScales((prev) => ({
                      ...prev,
                      emotionalIntensity: value,
                    }))
                  }
                />
                <Scale
                  label="Humor"
                  max={10}
                  value={styleScales.humor}
                  onChange={(value) =>
                    setStyleScales((prev) => ({ ...prev, humor: value }))
                  }
                />
                <Scale
                  label="Darkness"
                  max={10}
                  value={styleScales.darkness}
                  onChange={(value) =>
                    setStyleScales((prev) => ({ ...prev, darkness: value }))
                  }
                />
              </div>
              <div
                style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <Button variant="ghost" onClick={handleStyleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleStyleSave}>Save</Button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {story.authorStyle?.voice ? (
                <div style={{ color: "var(--color-text)" }}>
                  <strong>Voice:</strong> {story.authorStyle.voice}
                </div>
              ) : null}
              {story.authorStyle?.personality ? (
                <div style={{ color: "var(--color-text)" }}>
                  <strong>Personality:</strong> {story.authorStyle.personality}
                </div>
              ) : null}
              {story.authorStyle?.styleNotes ? (
                <div style={{ color: "var(--color-text)" }}>
                  <strong>Notes:</strong> {story.authorStyle.styleNotes}
                </div>
              ) : null}
              <div style={{ display: "grid", gap: 12 }}>
                {story.authorStyle?.scales?.formality ? (
                  <Scale
                    label="Formality"
                    max={10}
                    value={story.authorStyle.scales.formality}
                    readOnly
                  />
                ) : null}
                {story.authorStyle?.scales?.descriptiveness ? (
                  <Scale
                    label="Descriptiveness"
                    max={10}
                    value={story.authorStyle.scales.descriptiveness}
                    readOnly
                  />
                ) : null}
                {story.authorStyle?.scales?.pacing ? (
                  <Scale
                    label="Pacing"
                    max={10}
                    value={story.authorStyle.scales.pacing}
                    readOnly
                  />
                ) : null}
                {story.authorStyle?.scales?.dialogueFocus ? (
                  <Scale
                    label="Dialogue focus"
                    max={10}
                    value={story.authorStyle.scales.dialogueFocus}
                    readOnly
                  />
                ) : null}
                {story.authorStyle?.scales?.emotionalIntensity ? (
                  <Scale
                    label="Emotional intensity"
                    max={10}
                    value={story.authorStyle.scales.emotionalIntensity}
                    readOnly
                  />
                ) : null}
                {story.authorStyle?.scales?.humor ? (
                  <Scale
                    label="Humor"
                    max={10}
                    value={story.authorStyle.scales.humor}
                    readOnly
                  />
                ) : null}
                {story.authorStyle?.scales?.darkness ? (
                  <Scale
                    label="Darkness"
                    max={10}
                    value={story.authorStyle.scales.darkness}
                    readOnly
                  />
                ) : null}
              </div>
              {!story.authorStyle ? (
                <div style={{ color: "var(--color-text-muted)" }}>
                  No author style set yet.
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Card>
      <Card>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Link to={`/stories/${story.id}/plot-lines`} style={linkStyle}>
            Plot lines
          </Link>
          <Link to={`/stories/${story.id}/characters`} style={linkStyle}>
            Characters
          </Link>
          <Link to={`/stories/${story.id}/groups`} style={linkStyle}>
            Groups
          </Link>
          <Link to={`/stories/${story.id}/locations`} style={linkStyle}>
            Locations
          </Link>
          <Link to={`/stories/${story.id}/species`} style={linkStyle}>
            Species
          </Link>
          <Link to={`/stories/${story.id}/items`} style={linkStyle}>
            Items
          </Link>
          <Link to={`/stories/${story.id}/languages`} style={linkStyle}>
            Languages
          </Link>
        </nav>
      </Card>
    </div>
  );
}

const linkStyle: CSSProperties = {
  padding: "8px 12px",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  textDecoration: "none",
  color: "var(--color-text)",
  background: "var(--color-surface)",
};
