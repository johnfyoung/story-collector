import { useState, useEffect } from "react";
import type { Character, StoryContent } from "../types";
import { buildImagePrompt, validatePrompt } from "../lib/imagePromptBuilder";
import {
  generateImage,
  isOpenAIConfigured,
  getDefaultModel,
  IMAGE_MODELS,
  IMAGE_QUALITIES,
} from "../lib/openaiImageGen";
import type {
  GenerateImageOptions,
  ImageModel,
  ImageQuality,
  ImageSize,
} from "../lib/openaiImageGen";
import { Button } from "./Button";
import { TextArea } from "./TextArea";

const QUALITY_LABELS: Record<ImageQuality, string> = {
  low: "Low",
  medium: "Medium",
  high: "High (Higher Cost)",
  xhigh: "Extra High (Higher Cost)",
  max: "Max (Highest Cost)",
};

type ImageGeneratorDialogProps = {
  character: Pick<Character, "name" | "shortDescription" | "descriptors">;
  storyContent?: StoryContent;
  referenceImages?: string[];
  onClose: () => void;
  onImageGenerated: (imageUrl: string, prompt: string) => void;
};

export function ImageGeneratorDialog({
  character,
  storyContent,
  referenceImages = [],
  onClose,
  onImageGenerated,
}: ImageGeneratorDialogProps) {
  const [step, setStep] = useState<"configure" | "generating" | "preview">(
    "configure"
  );
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<
    | "portrait"
    | "fantasy-art"
    | "realistic-photo"
    | "anime"
    | "oil-painting"
    | "digital-art"
  >("portrait");
  const [size, setSize] = useState<ImageSize>("1024x1024");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string>("");

  const [model, setModel] = useState<ImageModel>(getDefaultModel);
  const [quality, setQuality] = useState<ImageQuality>("medium");

  const availableReferenceImages = referenceImages
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  useEffect(() => {
    const initialPrompt = buildImagePrompt(character, {
      style,
      quality: quality === "xhigh" || quality === "max" ? "ultra" : "high",
      storyContent,
    });
    setPrompt(initialPrompt);
  }, [character, style, quality, storyContent]);

  const handleGenerate = async () => {
    setError(null);

    const validation = validatePrompt(prompt);
    if (!validation.valid) {
      setError(validation.error || "Invalid prompt");
      return;
    }

    setIsGenerating(true);
    setStep("generating");

    try {
      const options: GenerateImageOptions = {
        prompt,
        size,
        quality,
        model,
        referenceImageUrl: referenceImageUrl || undefined,
      };

      const result = await generateImage(options);
      setGeneratedImageUrl(result.url);
      setRevisedPrompt(result.revisedPrompt || null);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image");
      setStep("configure");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = () => {
    if (generatedImageUrl) {
      onImageGenerated(generatedImageUrl, prompt);
      onClose();
    }
  };

  const handleRegenerate = () => {
    setGeneratedImageUrl(null);
    setRevisedPrompt(null);
    setStep("configure");
  };

  if (!isOpenAIConfigured()) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            padding: 24,
            maxWidth: 500,
            margin: 16,
            border: "1px solid var(--color-border)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ color: "var(--color-text)", margin: "0 0 12px 0" }}>
            OpenAI Not Configured
          </h2>
          <p style={{ color: "var(--color-text-muted)", margin: "0 0 16px 0" }}>
            To use AI image generation, set VITE_APPWRITE_IMAGE_FUNCTION_ID to
            the ID of the deployed generate-image Appwrite Function.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-md)",
          padding: 24,
          maxWidth: 700,
          width: "100%",
          margin: 16,
          border: "1px solid var(--color-border)",
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: "var(--color-text)", margin: "0 0 16px 0" }}>
          Generate AI Image
        </h2>

        {step === "configure" && (
          <>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    color: "var(--color-text)",
                    marginBottom: 8,
                    fontWeight: 500,
                  }}
                >
                  Image Prompt
                </label>
                <TextArea
                  value={prompt}
                  onChange={(e) => setPrompt(e.currentTarget.value)}
                  placeholder="Describe the character image you want to generate..."
                  rows={6}
                />
                <div
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "var(--font-sm)",
                    marginTop: 4,
                  }}
                >
                  This prompt was auto-generated from appearance attributes. You
                  can edit it freely.
                </div>
              </div>

              {availableReferenceImages.length > 0 && (
                <div style={{ display: "grid", gap: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        color: "var(--color-text)",
                        fontWeight: 500,
                      }}
                    >
                      Reference image (Select One)
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setReferenceImageUrl("")}
                      style={{
                        border: "1px dashed var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        padding: "6px 10px",
                        background: referenceImageUrl
                          ? "transparent"
                          : "var(--color-bg)",
                        color: "var(--color-text)",
                        cursor: "pointer",
                      }}
                    >
                      None
                    </button>
                    {availableReferenceImages.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setReferenceImageUrl(url)}
                        style={{
                          border:
                            referenceImageUrl === url
                              ? "2px solid var(--color-primary)"
                              : "1px solid var(--color-border)",
                          borderRadius: "var(--radius-sm)",
                          padding: 2,
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <img
                          src={url}
                          alt="Reference"
                          style={{
                            width: 72,
                            height: 72,
                            objectFit: "cover",
                            display: "block",
                            borderRadius: "var(--radius-sm)",
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label
                  style={{
                    display: "block",
                    color: "var(--color-text)",
                    marginBottom: 8,
                    fontWeight: 500,
                  }}
                >
                  Art Style
                </label>
                <select
                  value={style}
                  onChange={(e) =>
                    setStyle(e.currentTarget.value as typeof style)
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                >
                  <option value="portrait">Portrait</option>
                  <option value="fantasy-art">Fantasy Art</option>
                  <option value="realistic-photo">Realistic Photo</option>
                  <option value="anime">Anime</option>
                  <option value="oil-painting">Oil Painting</option>
                  <option value="digital-art">Digital Art</option>
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "var(--color-text)",
                      marginBottom: 8,
                      fontWeight: 500,
                    }}
                  >
                    Quality
                  </label>
                  <select
                    value={quality}
                    onChange={(e) =>
                      setQuality(e.currentTarget.value as ImageQuality)
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-surface)",
                      color: "var(--color-text)",
                    }}
                  >
                    {IMAGE_QUALITIES.map((q) => (
                      <option key={q} value={q}>
                        {QUALITY_LABELS[q]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      color: "var(--color-text)",
                      marginBottom: 8,
                      fontWeight: 500,
                    }}
                  >
                    Size
                  </label>
                  <select
                    value={size}
                    onChange={(e) =>
                      setSize(e.currentTarget.value as typeof size)
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-surface)",
                      color: "var(--color-text)",
                    }}
                  >
                    <option value="1024x1024">Square (1024×1024)</option>
                    <option value="1536x1024">Landscape (1536×1024)</option>
                    <option value="1024x1536">Portrait (1024×1536)</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  padding: 12,
                  background: "var(--color-background)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div
                  style={{
                    color: "var(--color-text)",
                    fontSize: "var(--font-sm)",
                  }}
                >
                  <label
                    htmlFor="image-model"
                    style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
                  >
                    Model
                  </label>
                  <select
                    id="image-model"
                    value={model}
                    onChange={(e) =>
                      setModel(e.currentTarget.value as ImageModel)
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-surface)",
                      color: "var(--color-text)",
                    }}
                  >
                    {IMAGE_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "var(--font-sm)",
                    marginTop: 8,
                  }}
                >
                  Flare is fast for everyday images; Sunburst is best when
                  editing from a reference image.
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: 12,
                    background: "#fee",
                    border: "1px solid #fcc",
                    borderRadius: "var(--radius-sm)",
                    color: "#c00",
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 24,
              }}
            >
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                Generate Image
              </Button>
            </div>
          </>
        )}

        {step === "generating" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div
              style={{
                color: "var(--color-text)",
                fontSize: "var(--font-lg)",
                marginBottom: 16,
              }}
            >
              Generating your image...
            </div>
            <div style={{ color: "var(--color-text-muted)" }}>
              This may take 10-30 seconds
            </div>
          </div>
        )}

        {step === "preview" && generatedImageUrl && (
          <>
            <div style={{ display: "grid", gap: 16 }}>
              <div
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                }}
              >
                <img
                  src={generatedImageUrl}
                  alt="Generated character"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>

              {revisedPrompt && revisedPrompt !== prompt && (
                <div
                  style={{
                    padding: 12,
                    background: "var(--color-background)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div
                    style={{
                      color: "var(--color-text)",
                      fontSize: "var(--font-sm)",
                      fontWeight: 500,
                      marginBottom: 4,
                    }}
                  >
                    Revised Prompt (by AI):
                  </div>
                  <div
                    style={{
                      color: "var(--color-text-muted)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    {revisedPrompt}
                  </div>
                </div>
              )}

              <div
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "var(--font-sm)",
                }}
              >
                The generated image will be uploaded to Cloudinary and added to
                your character's images. The prompt will be saved to the AI
                Image Prompt field.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 24,
              }}
            >
              <Button variant="ghost" onClick={handleRegenerate}>
                Regenerate
              </Button>
              <Button onClick={handleAccept}>Use This Image</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
