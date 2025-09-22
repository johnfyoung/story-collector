import { Databases, Storage, Permission, Role } from "appwrite";
import { type Models } from "appwrite";
import { client, ID } from "./appwrite";
import { type Story, type StoryContent } from "../types";

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
  };
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
      this.permsOwner()
    );
    const doc = await this.db.createDocument(
      DB_ID,
      STORIES_COLLECTION_ID,
      ID.unique(),
      {
        ...meta,
        jsonFileId: file.$id,
      } as any,
      this.permsOwner()
    );
    return { story: toStory(doc), fileId: file.$id };
  }

  async update(id: string, patch: Partial<Omit<Story, "id">>): Promise<Story> {
    if (!DB_ID || !STORIES_COLLECTION_ID)
      throw new Error("Remote stories not configured");
    const doc = await this.db.updateDocument(
      DB_ID,
      STORIES_COLLECTION_ID,
      id,
      patch as any
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
      this.permsOwner()
    );
    await this.db.updateDocument(DB_ID, STORIES_COLLECTION_ID, storyId, {
      jsonFileId: file.$id,
    } as any);
    // Optionally delete old file (ignore errors)
    if (currentFileId && currentFileId !== file.$id) {
      try {
        await this.storage.deleteFile(BUCKET_ID, currentFileId);
      } catch {}
    }
    return file.$id;
  }

  async readJson(fileId: string): Promise<StoryContent> {
    if (!BUCKET_ID) throw new Error("Remote stories not configured");
    // getFileDownload returns a URL that requires a fetch
    const urlOrString = this.storage.getFileDownload(
      BUCKET_ID,
      fileId
    ) as unknown as string | URL;
    const href =
      typeof urlOrString === "string" ? urlOrString : urlOrString.href;
    const res = await fetch(href, { credentials: "include" });
    return (await res.json()) as StoryContent;
  }

  async deleteStory(storyId: string): Promise<void> {
    if (!DB_ID || !STORIES_COLLECTION_ID || !BUCKET_ID)
      throw new Error("Remote stories not configured");
    try {
      const doc = await this.db.getDocument(
        DB_ID,
        STORIES_COLLECTION_ID,
        storyId
      );
      const fileId = String((doc as any).jsonFileId || "");
      await this.db.deleteDocument(DB_ID, STORIES_COLLECTION_ID, storyId);
      if (fileId) {
        try {
          await this.storage.deleteFile(BUCKET_ID, fileId);
        } catch {
          // ignore file cleanup failure
        }
      }
    } catch (e) {
      // rethrow to surface to caller
      throw e;
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
