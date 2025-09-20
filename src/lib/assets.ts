import { ID, client } from "./appwrite";
import { Storage, Permission, Role } from "appwrite";
import { isRemoteConfigured } from "./storiesService";

const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_STORIES as
  | string
  | undefined;

export async function uploadImage(
  file: File,
  ownerId?: string
): Promise<{ fileId: string; href: string }> {
  const storage = new Storage(client);
  if (!BUCKET_ID || !isRemoteConfigured() || !ownerId) {
    // Fallback: data URL only
    const href = await fileToDataURL(file);
    return { fileId: "local", href };
  }
  const perms = [
    Permission.read(Role.user(ownerId)),
    Permission.write(Role.user(ownerId)),
    Permission.update(Role.user(ownerId)),
    Permission.delete(Role.user(ownerId)),
  ];
  const created = await storage.createFile(BUCKET_ID, ID.unique(), file, perms);
  const href = storage.getFileView.call(
    storage,
    BUCKET_ID,
    created.$id
  ) as unknown as string | URL;
  return {
    fileId: created.$id,
    href: typeof href === "string" ? href : href.href,
  };
}

async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
