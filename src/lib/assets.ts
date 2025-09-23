import { isCloudinaryConfigured, uploadImageFile } from "./cloudinary";

export { openCloudinaryUploadWidget } from "./cloudinary";
export { isCloudinaryConfigured };

export async function uploadImage(
  file: File,
  ownerId?: string
): Promise<{ fileId: string; href: string }> {
  if (isCloudinaryConfigured()) {
    return uploadImageFile(file, ownerId);
  }

  const href = await fileToDataURL(file);
  return { fileId: "local", href };
}

async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
