export { isCloudinaryConfigured, openCloudinaryUploadWidget } from "./cloudinary";

export async function uploadImage(
  file: File
): Promise<{ fileId: string; href: string }> {
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
