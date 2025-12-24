import { type FormEvent, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Scale } from "../components/Scale";
import { TextArea } from "../components/TextArea";
import { TextField } from "../components/TextField";
import { useStories } from "../state/StoriesProvider";
import type { AuthorStyle, AuthorStyleScales } from "../types";

const MAX_DESC = 160;

export default function StoryForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { get, create, update } = useStories();
  const existing = useMemo(() => (id ? get(id) : undefined), [id, get]);

  const [name, setName] = useState(existing?.name ?? "");
  const [shortDescription, setShortDescription] = useState(
    existing?.shortDescription ?? ""
  );
  const [styleVoice, setStyleVoice] = useState(
    existing?.authorStyle?.voice ?? ""
  );
  const [stylePersonality, setStylePersonality] = useState(
    existing?.authorStyle?.personality ?? ""
  );
  const [styleNotes, setStyleNotes] = useState(
    existing?.authorStyle?.styleNotes ?? ""
  );
  const [styleScales, setStyleScales] = useState<AuthorStyleScales>({
    formality: existing?.authorStyle?.scales?.formality,
    descriptiveness: existing?.authorStyle?.scales?.descriptiveness,
    pacing: existing?.authorStyle?.scales?.pacing,
    dialogueFocus: existing?.authorStyle?.scales?.dialogueFocus,
    emotionalIntensity: existing?.authorStyle?.scales?.emotionalIntensity,
    humor: existing?.authorStyle?.scales?.humor,
    darkness: existing?.authorStyle?.scales?.darkness,
  });

  const buildAuthorStyle = (): AuthorStyle | undefined => {
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (isEdit && id) {
      update(id, {
        name: name.trim(),
        shortDescription: shortDescription.trim().slice(0, MAX_DESC),
        authorStyle: buildAuthorStyle(),
      });
      navigate(`/stories/${id}`);
    } else {
      const s = await create({
        name: name.trim(),
        shortDescription: shortDescription.trim().slice(0, MAX_DESC),
        authorStyle: buildAuthorStyle(),
      });
      navigate(`/stories/${s.id}`);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ color: "var(--color-text)" }}>
        {isEdit ? "Edit Story" : "New Story"}
      </h1>
      <Card>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <TextField
            label="Name"
            placeholder="e.g., The Lost Expedition"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <TextArea
            label="Short description"
            placeholder="Up to 160 characters"
            value={shortDescription}
            onChange={(e) =>
              setShortDescription(e.currentTarget.value.slice(0, MAX_DESC))
            }
            maxChars={MAX_DESC}
          />
          <div
            style={{
              borderTop: "1px solid var(--color-border)",
              paddingTop: 12,
              marginTop: 4,
              display: "grid",
              gap: 12,
            }}
          >
            <div style={{ color: "var(--color-text)", fontWeight: 600 }}>
              Author style
            </div>
            <TextArea
              label="Voice"
              placeholder="Describe the narrative voice (e.g., lyrical, precise, conversational)"
              value={styleVoice}
              onChange={(e) => setStyleVoice(e.currentTarget.value)}
              rows={3}
            />
            <TextArea
              label="Personality"
              placeholder="Describe the narrator's personality or stance"
              value={stylePersonality}
              onChange={(e) => setStylePersonality(e.currentTarget.value)}
              rows={3}
            />
            <TextArea
              label="Style notes"
              placeholder="Any additional guidance on style, diction, or structure"
              value={styleNotes}
              onChange={(e) => setStyleNotes(e.currentTarget.value)}
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
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="ghost"
              type="button"
              onClick={() =>
                isEdit && id ? navigate(`/stories/${id}`) : navigate("/")
              }
            >
              Cancel
            </Button>
            <Button type="submit">{isEdit ? "Save" : "Create"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
