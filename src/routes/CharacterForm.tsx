import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { MentionArea } from "../components/MentionArea";
import { TabNav } from "../components/TabNav";
import { useStories } from "../state/StoriesProvider";
import { Avatar } from "../components/Avatar";
import type {
  Character,
  Descriptor,
  DescriptorKey,
  StoryContent,
  ElementConnection,
} from "../types";
import { Disclosure } from "../components/Disclosure";
import { Scale } from "../components/Scale";
import { AttributePicker } from "../components/AttributePicker";
import { ImagesField } from "../components/ImagesField";
import { parseImageValue, stringifyImageValue } from "../lib/descriptorImages";
import { addRecentEdit } from "../lib/recentEdits";
import {
  extractConnectionsFromText,
  getAllMentionableElements,
  mergeConnections,
  resolveConnectionsInText,
  updateConnectionNames,
  type MentionableElement,
} from "../lib/connections";

type AttrMeta = {
  key: DescriptorKey;
  label: string;
  type: "short" | "long" | "scale5" | "scale10" | "media";
};
const PROFILE_ATTRS: AttrMeta[] = [
  { key: "species", label: "Species", type: "short" },
  { key: "age", label: "Age", type: "short" },
  { key: "gender", label: "Gender", type: "short" },
  { key: "birthday", label: "Birthday", type: "short" },
  { key: "birthplace", label: "Birthplace", type: "short" },
  { key: "nicknames", label: "Nicknames", type: "long" },
  { key: "pets", label: "Pets", type: "long" },
  { key: "children", label: "Children", type: "long" },
  { key: "maritalStatus", label: "Marital Status", type: "short" },
  { key: "dominantHand", label: "Dominant Hand", type: "short" },
  { key: "pronouns", label: "Pronouns", type: "short" },
];

const APPEARANCE_ATTRS: AttrMeta[] = [
  { key: "aiImagePrompt", label: "AI Image Prompt", type: "long" },
  { key: "ethnicity", label: "Ethnicity", type: "short" },
  { key: "bodyType", label: "Body type", type: "short" },
  { key: "height", label: "Height", type: "short" },
  { key: "weight", label: "Weight", type: "short" },
  { key: "skinTone", label: "Skin tone", type: "short" },
  { key: "eyeColor", label: "Eye Color", type: "short" },
  { key: "hairColor", label: "Hair color", type: "short" },
  { key: "hairstyle", label: "Hairstyle", type: "short" },
  {
    key: "distinguishingFeature",
    label: "Distinguishing feature",
    type: "long",
  },
  { key: "otherFacialFeatures", label: "Other facial features", type: "long" },
  { key: "tattoos", label: "Tattoos", type: "long" },
  { key: "scars", label: "Scars", type: "long" },
  { key: "clothingStyle", label: "Clothing style", type: "long" },
  { key: "accessories", label: "Accessories", type: "long" },
];

const PERSONALITY_ATTRS: AttrMeta[] = [
  { key: "extroversion", label: "Extroversion", type: "scale5" },
  { key: "agreeableness", label: "Agreeableness", type: "scale5" },
  { key: "conscientiousness", label: "Conscientiousness", type: "scale5" },
  { key: "openness", label: "Openness", type: "scale5" },
  { key: "neuroticism", label: "Neuroticism", type: "scale5" },
  { key: "moral", label: "Moral", type: "long" },
  { key: "confidenceLevel", label: "Confidence level", type: "short" },
  { key: "selfControl", label: "Self control", type: "short" },
  { key: "truthfulness", label: "Truthfulness", type: "short" },
  { key: "manners", label: "Manners", type: "short" },
  { key: "motivation", label: "Motivation", type: "long" },
  { key: "discouragement", label: "Discouragement", type: "long" },
  { key: "greatestFear", label: "Greatest fear", type: "long" },
  { key: "sex", label: "Sex", type: "short" },
  { key: "sexualOrientation", label: "Sexual Orientation", type: "short" },
  { key: "bias", label: "Bias", type: "long" },
  { key: "addictions", label: "Addictions", type: "long" },
  { key: "secrets", label: "Secrets", type: "long" },
];

const BACKGROUND_ATTRS: AttrMeta[] = [
  { key: "history", label: "History", type: "long" },
  { key: "world", label: "World", type: "long" },
  { key: "originCountry", label: "Origin country", type: "short" },
  { key: "areaOfResidence", label: "Area of residence", type: "short" },
  { key: "neighborhood", label: "Neighborhood", type: "short" },
  { key: "homeDescription", label: "Home description", type: "long" },
  { key: "importantPastEvents", label: "Important past events", type: "long" },
  { key: "childhood", label: "Childhood", type: "long" },
  { key: "education", label: "Education", type: "long" },
  { key: "bestAccomplishment", label: "Best accomplishment", type: "long" },
  { key: "otherAccomplishment", label: "Other accomplishment", type: "long" },
  { key: "failure", label: "Failure", type: "long" },
  { key: "bestMemories", label: "Best memories", type: "long" },
  { key: "worstMemories", label: "Worst memories", type: "long" },
  { key: "criminalRecords", label: "Criminal records", type: "long" },
  { key: "debts", label: "Debts", type: "long" },
  { key: "assets", label: "Assets", type: "long" },
  { key: "deathday", label: "Deathday", type: "short" },
];

const ABILITIES_ATTRS: AttrMeta[] = [
  { key: "skills", label: "Skills", type: "long" },
  { key: "talent", label: "Talent", type: "long" },
  { key: "hobbies", label: "Hobbies", type: "long" },
  { key: "habits", label: "Habits", type: "long" },
  { key: "weakness", label: "Weakness", type: "long" },
  { key: "incompetence", label: "Incompetence", type: "long" },
  {
    key: "supernaturalAbilities",
    label: "Supernatural abilities",
    type: "long",
  },
  { key: "weaponProficiency", label: "Weapon proficiency", type: "long" },
  { key: "fightingStyle", label: "Fighting style", type: "long" },
  { key: "strength", label: "Strength", type: "scale10" },
  { key: "dexterity", label: "Dexterity", type: "scale10" },
  { key: "intelligence", label: "Intelligence", type: "scale10" },
  { key: "charisma", label: "Charisma", type: "scale10" },
  { key: "speed", label: "Speed", type: "scale10" },
  { key: "stamina", label: "Stamina", type: "scale10" },
];

const LIFESTYLE_ATTRS: AttrMeta[] = [
  { key: "lifestyle", label: "Lifestyle", type: "long" },
  { key: "job", label: "Job", type: "short" },
  { key: "jobSatisfaction", label: "Job Satisfaction", type: "scale10" },
  { key: "health", label: "Health", type: "short" },
  { key: "residentialStatus", label: "Residential status", type: "short" },
  { key: "dwelling", label: "Dwelling", type: "short" },
  { key: "politicalViews", label: "Political views", type: "short" },
  { key: "religion", label: "Religion", type: "short" },
  { key: "diets", label: "Diets", type: "short" },
  { key: "modeOfTransport", label: "Mode of transport", type: "short" },
  { key: "clubs", label: "Clubs", type: "long" },
  { key: "money", label: "Money", type: "short" },
  { key: "favoriteColor", label: "Favorite color", type: "short" },
];

const SOCIAL_ATTRS: AttrMeta[] = [
  { key: "localReputation", label: "Local reputation", type: "long" },
  { key: "regionalReputation", label: "Regional reputation", type: "long" },
  {
    key: "internationalReputation",
    label: "International reputation",
    type: "long",
  },
  { key: "socialClass", label: "Social class", type: "short" },
  { key: "familyMembers", label: "Family members", type: "long" },
  { key: "familyTree", label: "Family tree", type: "long" },
  { key: "significantOther", label: "Significant other", type: "short" },
  { key: "spouse", label: "Spouse", type: "short" },
  { key: "relationships", label: "Relationships", type: "long" },
  { key: "allies", label: "Allies", type: "long" },
  { key: "enemies", label: "Enemies", type: "long" },
];

const COMMUNICATION_ATTRS: AttrMeta[] = [
  { key: "primaryLanguage", label: "Primary language", type: "short" },
  { key: "secondaryLanguages", label: "Secondary languages", type: "long" },
  { key: "languageFluency", label: "Language fluency", type: "short" },
  { key: "accentDialect", label: "Accent dialect", type: "short" },
  { key: "slangOrJargon", label: "Slang or jargon", type: "long" },
  { key: "literacy", label: "Literacy", type: "short" },
];

const STORY_ATTRS: AttrMeta[] = [
  { key: "storyRole", label: "Story role", type: "short" },
  { key: "shortTermGoals", label: "Short term goals", type: "long" },
  { key: "longTermGoals", label: "Long term goals", type: "long" },
];

const MEDIA_ATTRS: AttrMeta[] = [
  { key: "images", label: "Images", type: "media" },
];

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function CharacterForm() {
  const { id: storyId, charId } = useParams();
  const navigate = useNavigate();
  const { loadContent, saveContent, get: getStory } = useStories();
  const [content, setContent] = useState<StoryContent | null>(null);
  const [name, setName] = useState("");
  const [longName, setLongName] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [descriptors, setDescriptors] = useState<Descriptor[]>([]);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [highlightedDescriptorId, setHighlightedDescriptorId] = useState<string | null>(null);
  const descriptorRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [shortDescConnections, setShortDescConnections] = useState<
    ElementConnection[]
  >([]);
  const [longDescConnections, setLongDescConnections] = useState<
    ElementConnection[]
  >([]);

  useEffect(() => {
    if (!storyId) return;
    loadContent(storyId).then((c) => {
      const elements = getAllMentionableElements(c);
      setContent(c);
      if (charId) {
        const existing = c.characters.find((x) => x.id === charId);
        if (existing) {
          const speciesEls = elements.filter((e) => e.type === "species");
          const locationEls = elements.filter((e) => e.type === "location");
          const characterEls = elements.filter((e) => e.type === "character");
          const languageEls = elements.filter((e) => e.type === "language");
          const getDescriptorElements = (key: DescriptorKey) => {
            if (key === "birthplace") return locationEls;
            if (key === "species") return speciesEls;
            if (key === "primaryLanguage" || key === "secondaryLanguages") {
              return languageEls;
            }
            if (
              [
                "pets",
                "children",
                "significantOther",
                "spouse",
                "allies",
                "enemies",
                "familyMembers",
                "relationships",
              ].includes(key)
            ) {
              return characterEls;
            }
            return elements;
          };

          setName(existing.name);
          setAvatarUrl(existing.avatarUrl);
          setLongName(existing.longName ?? "");

          const resolvedShort = resolveConnectionsInText(
            existing.shortDescription ?? "",
            existing.connections ?? [],
            elements
          );
          setShortDesc(resolvedShort);
          setShortDescConnections(
            extractConnectionsFromText(resolvedShort, elements)
          );

          const resolvedLong = resolveConnectionsInText(
            existing.longDescription ?? "",
            existing.connections ?? [],
            elements
          );
          setLongDesc(resolvedLong);
          setLongDescConnections(
            extractConnectionsFromText(resolvedLong, elements)
          );

          const resolvedDescriptors = (existing.descriptors ?? []).map((d) => {
            const allowed = getDescriptorElements(d.key);
            const lookup = allowed.length > 0 ? allowed : elements;
            const baseConnections = d.connections ?? existing.connections ?? [];
            const resolvedValue = resolveConnectionsInText(
              d.value ?? "",
              baseConnections,
              lookup
            );
            const connections =
              baseConnections.length > 0
                ? updateConnectionNames(baseConnections, lookup)
                : extractConnectionsFromText(resolvedValue, lookup);
            return { ...d, value: resolvedValue, connections };
          });
          setDescriptors(resolvedDescriptors);
        }
      }
    });
  }, [storyId, charId, loadContent]);

  const mentionableElements = useMemo<MentionableElement[]>(() => {
    if (!content) return [];
    return getAllMentionableElements(content);
  }, [content]);

  const speciesElements = useMemo(
    () => mentionableElements.filter((e) => e.type === "species"),
    [mentionableElements]
  );
  const locationElements = useMemo(
    () => mentionableElements.filter((e) => e.type === "location"),
    [mentionableElements]
  );
  const characterElements = useMemo(
    () => mentionableElements.filter((e) => e.type === "character"),
    [mentionableElements]
  );
  const languageElements = useMemo(
    () => mentionableElements.filter((e) => e.type === "language"),
    [mentionableElements]
  );

  const availableImages = useMemo(() => {
    const imagesDescriptor = descriptors.find((d) => d.key === "images");
    return imagesDescriptor ? parseImageValue(imagesDescriptor.value) : [];
  }, [descriptors]);

  const handleAvatarChange = (nextUrl: string) => {
    const previousUrl = avatarUrl;
    setAvatarUrl(nextUrl);
    if (!nextUrl) return;
    setDescriptors((prev) => {
      const imagesDescriptor = prev.find((d) => d.key === "images");
      const images = imagesDescriptor ? parseImageValue(imagesDescriptor.value) : [];
      const nextImages = [...images];
      if (previousUrl && !nextImages.includes(previousUrl)) {
        nextImages.unshift(previousUrl);
      }
      if (!nextImages.includes(nextUrl)) {
        nextImages.unshift(nextUrl);
      }
      const nextValue = stringifyImageValue(nextImages);
      if (imagesDescriptor) {
        return prev.map((d) =>
          d.id === imagesDescriptor.id ? { ...d, value: nextValue } : d
        );
      }
      return [
        ...prev,
        { id: genId(), key: "images", value: nextValue },
      ];
    });
  };

  function addDescriptor(key: DescriptorKey) {
    let nextHighlightId: string | null = null;
    setDescriptors((prev) => {
      const existing = prev.find((d) => d.key === key);
      if (existing) {
        nextHighlightId = existing.id;
        return prev;
      }
      const id = genId();
      nextHighlightId = id;
      return [...prev, { id, key, value: "" }];
    });
    if (nextHighlightId) setHighlightedDescriptorId(nextHighlightId);
  }

  function updateDescriptor(
    id: string,
    value: string,
    connections?: ElementConnection[]
  ) {
    setDescriptors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, value, connections } : d))
    );
  }

  async function onSave() {
    if (!storyId || !content || !name.trim()) return;
    setSaving(true);
    try {
      // Merge all connections from shortDescription, longDescription, and all descriptors
      const allDescriptorConnections = descriptors.flatMap(
        (d) => d.connections || []
      );
      const connections = mergeConnections(
        shortDescConnections,
        longDescConnections,
        allDescriptorConnections
      );

      const c: Character = {
        id: charId ?? genId(),
        name: name.trim(),
        longName: longName.trim() || undefined,
        shortDescription: shortDesc.trim(),
        longDescription: longDesc,
        descriptors,
        avatarUrl,
        lastEdited: Date.now(),
        connections,
      };
      const next: StoryContent = {
        ...content,
        characters: content.characters.some((x) => x.id === c.id)
          ? content.characters.map((x) => (x.id === c.id ? c : x))
          : [c, ...content.characters],
      };

      // If Birthplace attribute is present, ensure it's in Locations
      const birthplace = descriptors
        .find((d) => d.key === "birthplace")
        ?.value?.trim();
      if (
        birthplace &&
        !next.locations.some(
          (l) => l.name.toLowerCase() === birthplace.toLowerCase()
        )
      ) {
        next.locations = [{ id: genId(), name: birthplace }, ...next.locations];
      }
      await saveContent(storyId, next);

      // Track recent edit
      const story = getStory(storyId);
      if (story) {
        addRecentEdit({
          type: "character",
          elementId: c.id,
          elementName: c.name,
          storyId: storyId,
          storyName: story.name,
          editUrl: `/stories/${storyId}/characters/${c.id}/edit`,
        });
      }

      setHighlightedDescriptorId(null);
      navigate(`/stories/${storyId}/characters`);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!highlightedDescriptorId) return;
    const target = descriptorRefs.current[highlightedDescriptorId];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedDescriptorId, descriptors]);

  const highlightStyle = {
    outline: "2px solid var(--color-primary)",
    outlineOffset: 2,
    borderRadius: 8,
    background: "rgba(184, 132, 224, 0.08)",
  };

  if (!storyId) return null;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <TabNav active="characters" storyId={storyId} />
      {charId ? null : (
        <h1 style={{ color: "var(--color-text)", margin: 0 }}>Add character</h1>
      )}
      <Card>
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <Avatar
              name={name}
              url={avatarUrl}
              size={250}
              editable
              onChange={handleAvatarChange}
              availableImages={availableImages}
            />
            <div style={{ flex: 1, display: "grid", gap: 8 }}>
              <TextField
                label="Short name"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
              />
              <TextField
                label="Long name"
                value={longName}
                onChange={(e) => setLongName(e.currentTarget.value)}
              />
              <MentionArea
                label="Short description"
                value={shortDesc}
                onChange={(v, conn) => {
                  setShortDesc(v);
                  setShortDescConnections(conn);
                }}
                mentionableElements={mentionableElements}
                maxChars={160}
              />
            </div>
          </div>
          <div>
            <div
              style={{
                color: "var(--color-text-muted)",
                fontSize: "var(--font-sm)",
                marginBottom: 6,
              }}
            >
              Long description
            </div>
            <MentionArea
              value={longDesc}
              onChange={(v, conn) => {
                setLongDesc(v);
                setLongDescConnections(conn);
              }}
              mentionableElements={mentionableElements}
            />
          </div>
          <div
            style={{
              color: "var(--color-text)",
              fontWeight: 600,
              marginTop: 8,
            }}
          >
            Attributes
          </div>
          <AttributePicker
            categories={[
              {
                title: "Story",
                items: STORY_ATTRS.map(({ key, label }) => ({ key, label })),
              },

              {
                title: "Profile",
                items: PROFILE_ATTRS.map(({ key, label }) => ({ key, label })),
              },
              {
                title: "Appearance",
                items: APPEARANCE_ATTRS.map(({ key, label }) => ({
                  key,
                  label,
                })),
              },
              {
                title: "Media",
                items: MEDIA_ATTRS.map(({ key, label }) => ({ key, label })),
              },
              {
                title: "Personality",
                items: PERSONALITY_ATTRS.map(({ key, label }) => ({
                  key,
                  label,
                })),
              },
              {
                title: "Background",
                items: BACKGROUND_ATTRS.map(({ key, label }) => ({
                  key,
                  label,
                })),
              },
              {
                title: "Abilities",
                items: ABILITIES_ATTRS.map(({ key, label }) => ({
                  key,
                  label,
                })),
              },
              {
                title: "Lifestyle",
                items: LIFESTYLE_ATTRS.map(({ key, label }) => ({
                  key,
                  label,
                })),
              },
              {
                title: "Social",
                items: SOCIAL_ATTRS.map(({ key, label }) => ({ key, label })),
              },
              {
                title: "Communication",
                items: COMMUNICATION_ATTRS.map(({ key, label }) => ({
                  key,
                  label,
                })),
              },
            ]}
            chosenKeys={descriptors.map((d) => d.key)}
            onAdd={addDescriptor}
          />
          {/* Attribute inputs grouped by category & collapsible when present */}
          {[
            { title: "Profile", attrs: PROFILE_ATTRS },
            { title: "Appearance", attrs: APPEARANCE_ATTRS },
            { title: "Personality", attrs: PERSONALITY_ATTRS },
            { title: "Background", attrs: BACKGROUND_ATTRS },
            { title: "Abilities", attrs: ABILITIES_ATTRS },
            { title: "Lifestyle", attrs: LIFESTYLE_ATTRS },
            { title: "Social", attrs: SOCIAL_ATTRS },
            { title: "Communication", attrs: COMMUNICATION_ATTRS },
            { title: "Story", attrs: STORY_ATTRS },
            { title: "Media", attrs: MEDIA_ATTRS },
          ].map((group) => {
            const items = descriptors.filter((d) =>
              group.attrs.some((a) => a.key === d.key)
            );
            if (items.length === 0) return null;
            return (
              <Disclosure key={group.title} title={group.title} defaultOpen>
                <div style={{ display: "grid", gap: 10 }}>
                  {items.map((d) => {
                    const meta = group.attrs.find((a) => a.key === d.key)!;
                    const label = meta.label;
                    const isHighlighted = highlightedDescriptorId === d.id;
                    const wrapperProps = {
                      ref: (el: HTMLDivElement | null) => {
                        descriptorRefs.current[d.id] = el;
                      },
                      style: isHighlighted ? highlightStyle : undefined,
                      onFocusCapture: () => {
                        if (highlightedDescriptorId === d.id) {
                          setHighlightedDescriptorId(null);
                        }
                      },
                      onMouseDown: () => {
                        if (highlightedDescriptorId === d.id) {
                          setHighlightedDescriptorId(null);
                        }
                      },
                    };
                    if (meta.type === "scale5" || meta.type === "scale10") {
                      const max = meta.type === "scale5" ? 5 : 10;
                      return (
                        <div key={d.id} {...wrapperProps}>
                          <Scale
                            label={label}
                            max={max}
                            value={d.value}
                            onChange={(n) => updateDescriptor(d.id, String(n))}
                          />
                        </div>
                      );
                    }
                    if (meta.type === "media") {
                      return (
                        <div key={d.id} {...wrapperProps}>
                          <ImagesField
                            label={label}
                            value={d.value}
                            onChange={(next) => updateDescriptor(d.id, next)}
                            mainImageUrl={avatarUrl}
                            character={{
                              name,
                              shortDescription: shortDesc,
                              descriptors,
                            }}
                            storyContent={content || undefined}
                            onPromptSave={(prompt) => {
                              setDescriptors((prev) => {
                                const aiPromptDescriptor = prev.find(
                                  (d) => d.key === "aiImagePrompt"
                                );
                                if (aiPromptDescriptor) {
                                  return prev.map((d) =>
                                    d.id === aiPromptDescriptor.id
                                      ? { ...d, value: prompt }
                                      : d
                                  );
                                }
                                return [
                                  ...prev,
                                  {
                                    id: genId(),
                                    key: "aiImagePrompt",
                                    value: prompt,
                                  },
                                ];
                              });
                            }}
                          />
                        </div>
                      );
                    }
                    // mention-enabled short fields
                    const mentionKeys: DescriptorKey[] = [
                      "species",
                      "birthplace",
                      "primaryLanguage",
                      "secondaryLanguages",
                      "pets",
                      "children",
                      "significantOther",
                      "spouse",
                      "allies",
                      "enemies",
                      "familyMembers",
                      "relationships",
                      "storyRole",
                      "shortTermGoals",
                      "longTermGoals",
                    ];
                    const isMention = mentionKeys.includes(d.key);
                    if (isMention) {
                      const elems =
                        d.key === "birthplace"
                          ? locationElements
                          : d.key === "species"
                          ? speciesElements
                          : d.key === "primaryLanguage" ||
                            d.key === "secondaryLanguages"
                          ? languageElements
                          : d.key === "storyRole" ||
                            d.key === "shortTermGoals" ||
                            d.key === "longTermGoals"
                          ? mentionableElements
                          : characterElements;
                      return (
                        <div key={d.id} {...wrapperProps}>
                          <MentionArea
                            label={label}
                            value={d.value}
                            onChange={(v, conn) =>
                              updateDescriptor(d.id, v, conn)
                            }
                            mentionableElements={elems}
                            minHeight={40}
                          />
                        </div>
                      );
                    }
                    if (meta.type === "short") {
                      return (
                        <div key={d.id} {...wrapperProps}>
                          <TextField
                            label={label}
                            value={d.value}
                            onChange={(e) =>
                              updateDescriptor(d.id, e.currentTarget.value)
                            }
                          />
                        </div>
                      );
                    }
                    return (
                      <div key={d.id} {...wrapperProps}>
                        <MentionArea
                          label={label}
                          value={d.value}
                          onChange={(v, conn) => updateDescriptor(d.id, v, conn)}
                          mentionableElements={mentionableElements}
                        />
                      </div>
                    );
                  })}
                </div>
              </Disclosure>
            );
          })}
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
              onClick={() => {
                setHighlightedDescriptorId(null);
                navigate(-1);
              }}
            >
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saving || !name.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
