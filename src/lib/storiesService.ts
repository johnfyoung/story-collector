/* eslint-disable @typescript-eslint/no-explicit-any */
import { Databases, Storage, Permission, Role } from "appwrite";
import { type Models } from "appwrite";
import { client, ID } from "./appwrite";
import { type AuthorStyle, type AuthorStyleScales, type Story, type StoryContent } from "../types";

const DB_ID = import.meta.env.VITE_APPWRITE_DB_ID as string | undefined;
const STORIES_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_STORIES_COLLECTION_ID as string | undefined;
const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_STORIES as
  | string
  | undefined;

export function isRemoteConfigured(): boolean {
  return Boolean(DB_ID && STORIES_COLLECTION_ID && BUCKET_ID);
}

function toStory(doc: Models.Document): Story {
  return {
    id: doc.$id,
    name: String((doc as any).name ?? ""),
    shortDescription: String((doc as any).shortDescription ?? ""),
    authorStyle: normalizeAuthorStyle((doc as any).authorStyle),
  };
}

function normalizeAuthorStyle(raw: any): AuthorStyle | undefined {
  if (!raw) return undefined;
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  const voice = typeof parsed.voice === "string" ? parsed.voice : undefined;
  const personality = typeof parsed.personality === "string" ? parsed.personality : undefined;
  const styleNotes = typeof parsed.styleNotes === "string" ? parsed.styleNotes : undefined;
  const scalesRaw = parsed.scales ?? {};
  const scales: AuthorStyleScales = {
    formality: normalizeScale(scalesRaw.formality),
    descriptiveness: normalizeScale(scalesRaw.descriptiveness),
    pacing: normalizeScale(scalesRaw.pacing),
    dialogueFocus: normalizeScale(scalesRaw.dialogueFocus),
    emotionalIntensity: normalizeScale(scalesRaw.emotionalIntensity),
    humor: normalizeScale(scalesRaw.humor),
    darkness: normalizeScale(scalesRaw.darkness),
  };

  const hasScales = Object.values(scales).some((value) => typeof value === "number" && value > 0);
  if (!voice && !personality && !styleNotes && !hasScales) return undefined;
  return {
    voice,
    personality,
    styleNotes,
    scales: hasScales ? scales : undefined,
  };
}

function normalizeScale(value: any): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function serializeAuthorStyle(authorStyle?: AuthorStyle): string {
  if (!authorStyle) return "";
  try {
    return JSON.stringify(authorStyle);
  } catch {
    return "";
  }
}

export class StoriesRemote {
  private db = new Databases(client);
  private storage = new Storage(client);
  private ownerId: string;
  constructor(ownerId: string) {
    this.ownerId = ownerId;
  }

  private permsOwner() {
    const user = Role.user(this.ownerId);
    return [
      Permission.read(user),
      Permission.write(user),
      Permission.update(user),
      Permission.delete(user),
    ];
  }

  private permsFile() {
    const user = Role.user(this.ownerId);
    return [
      Permission.read(Role.any()),
      Permission.write(user),
      Permission.update(user),
      Permission.delete(user),
    ];
  }

  async listWithFiles(): Promise<{
    stories: Story[];
    files: Record<string, string>;
  }> {
    if (!DB_ID || !STORIES_COLLECTION_ID)
      throw new Error("Remote stories not configured");
    const res = await this.db.listDocuments(DB_ID, STORIES_COLLECTION_ID);
    const files: Record<string, string> = {};
    const stories = res.documents.map((d) => {
      const s = toStory(d);
      files[s.id] = String((d as any).jsonFileId ?? "");
      return s;
    });
    return { stories, files };
  }

  private static makeSafeFilename(title: string) {
    const normalized = title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // strip diacritics
      .toLowerCase();
    const slug =
      normalized
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-")
        .slice(0, 60) || "story";
    const suffix = Math.random().toString(36).slice(2, 8);
    return `${slug}-${suffix}.json`;
  }

  async createWithFile(
    meta: Omit<Story, "id">,
    content: StoryContent
  ): Promise<{ story: Story; fileId: string }> {
    if (!DB_ID || !STORIES_COLLECTION_ID || !BUCKET_ID)
      throw new Error("Remote stories not configured");
    const filename = StoriesRemote.makeSafeFilename(meta.name);
    const fileObj = new File([JSON.stringify(content, null, 2)], filename, {
      type: "application/json",
    });
    const file = await this.storage.createFile(
      BUCKET_ID,
      ID.unique(),
      fileObj,
      this.permsFile()
    );
    const doc = await this.db.createDocument(
      DB_ID,
      STORIES_COLLECTION_ID,
      ID.unique(),
      {
        ...meta,
        authorStyle: serializeAuthorStyle(meta.authorStyle),
        jsonFileId: file.$id,
      } as any,
      this.permsOwner()
    );
    return { story: toStory(doc), fileId: file.$id };
  }

  async update(id: string, patch: Partial<Omit<Story, "id">>): Promise<Story> {
    if (!DB_ID || !STORIES_COLLECTION_ID)
      throw new Error("Remote stories not configured");
    const updatePatch = { ...patch };
    const updatePayload: Record<string, any> = { ...updatePatch };
    if ("authorStyle" in updatePatch) {
      updatePayload.authorStyle = serializeAuthorStyle(updatePatch.authorStyle);
    }
    const doc = await this.db.updateDocument(
      DB_ID,
      STORIES_COLLECTION_ID,
      id,
      updatePayload as any
    );
    return toStory(doc);
  }

  async saveJson(
    storyId: string,
    data: StoryContent,
    currentFileId?: string
  ): Promise<string> {
    if (!DB_ID || !STORIES_COLLECTION_ID || !BUCKET_ID)
      throw new Error("Remote stories not configured");
    const fileObj = new File(
      [JSON.stringify(data, null, 2)],
      `${storyId}.json`,
      { type: "application/json" }
    );
    const file = await this.storage.createFile(
      BUCKET_ID,
      ID.unique(),
      fileObj,
      this.permsFile()
    );
    await this.db.updateDocument(DB_ID, STORIES_COLLECTION_ID, storyId, {
      jsonFileId: file.$id,
    } as any);
    // Optionally delete old file (ignore errors)
    if (currentFileId && currentFileId !== file.$id) {
      try {
        await this.storage.deleteFile(BUCKET_ID, currentFileId);
      } catch {
        // ignore cleanup failure
      }
    }
    return file.$id;
  }

  async readJson(fileId: string): Promise<StoryContent> {
    if (!BUCKET_ID) throw new Error("Remote stories not configured");
    // Use the Appwrite client to download so auth headers & cookies are preserved
    const url = this.storage.getFileDownload(BUCKET_ID, fileId) as URL;
    const data = await client.call("get", url);
    return data as StoryContent;
  }

  async deleteStory(storyId: string): Promise<void> {
    if (!DB_ID || !STORIES_COLLECTION_ID || !BUCKET_ID)
      throw new Error("Remote stories not configured");
    const doc = await this.db.getDocument(DB_ID, STORIES_COLLECTION_ID, storyId);
    const fileId = String((doc as any).jsonFileId || "");
    await this.db.deleteDocument(DB_ID, STORIES_COLLECTION_ID, storyId);
    if (fileId) {
      try {
        await this.storage.deleteFile(BUCKET_ID, fileId);
      } catch {
        // ignore file cleanup failure
      }
    }
  }

  subscribeDocs(
    handler: (
      type: "create" | "update" | "delete",
      doc: Story,
      raw: Models.Document
    ) => void
  ) {
    if (!DB_ID || !STORIES_COLLECTION_ID)
      throw new Error("Remote stories not configured");
    const channel = `databases.${DB_ID}.collections.${STORIES_COLLECTION_ID}.documents`;
    const unsub = client.subscribe(channel, (resp: any) => {
      const events: string[] = resp.events || [];
      const doc = resp.payload as Models.Document;
      const story = toStory(doc);
      if (events.some((e) => e.endsWith(".create"))) handler("create", story, doc);
      else if (events.some((e) => e.endsWith(".update")))
        handler("update", story, doc);
      else if (events.some((e) => e.endsWith(".delete")))
        handler("delete", story, doc);
    });
    return unsub;
  }

  subscribeFiles(
    handler: (type: "create" | "update" | "delete", fileId: string) => void
  ) {
    if (!BUCKET_ID) throw new Error("Remote stories not configured");
    const channel = `buckets.${BUCKET_ID}.files`;
    const unsub = client.subscribe(channel, (resp: any) => {
      const events: string[] = resp.events || [];
      const payload = resp.payload as { $id: string };
      if (events.some((e) => e.endsWith(".create")))
        handler("create", payload.$id);
      else if (events.some((e) => e.endsWith(".update")))
        handler("update", payload.$id);
      else if (events.some((e) => e.endsWith(".delete")))
        handler("delete", payload.$id);
    });
    return unsub;
  }
}
