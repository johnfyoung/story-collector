import { type FormEvent, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { TextArea } from "../components/TextArea";
import { TextField } from "../components/TextField";
import { useStories } from "../state/StoriesProvider";

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (isEdit && id) {
      update(id, {
        name: name.trim(),
        shortDescription: shortDescription.trim().slice(0, MAX_DESC),
      });
      navigate(`/stories/${id}`);
    } else {
      const s = await create({
        name: name.trim(),
        shortDescription: shortDescription.trim().slice(0, MAX_DESC),
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
