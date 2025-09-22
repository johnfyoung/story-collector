const CLOUDINARY_WIDGET_URL = "https://widget.cloudinary.com/v2.0/global/all.js";
const CLOUDINARY_CLOUD_NAME = import.meta.env
  .VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env
  .VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
const CLOUDINARY_UPLOAD_FOLDER = import.meta.env
  .VITE_CLOUDINARY_UPLOAD_FOLDER as string | undefined;

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);
}

type CloudinaryWidget = {
  open: () => void;
  close: () => void;
  destroy: () => void;
};

type CloudinaryWidgetInfo = Record<string, unknown> & {
  public_id?: string;
  asset_id?: string;
  secure_url?: string;
  url?: string;
};

type CloudinaryWidgetResult = {
  event: string;
  info?: CloudinaryWidgetInfo | null;
};

type Cloudinary = {
  createUploadWidget: (
    options: Record<string, unknown>,
    callback: (error: unknown, result: CloudinaryWidgetResult) => void
  ) => CloudinaryWidget;
};

declare global {
  interface Window {
    cloudinary?: Cloudinary;
  }
}

let widgetLibraryPromise: Promise<Cloudinary> | null = null;

function loadWidgetLibrary(): Promise<Cloudinary> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(
      new Error("Cloudinary upload widget is only available in the browser")
    );
  }

  if (window.cloudinary) {
    return Promise.resolve(window.cloudinary);
  }

  if (!widgetLibraryPromise) {
    widgetLibraryPromise = new Promise<Cloudinary>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-cloudinary-upload-widget="true"]'
      );

      const script = existingScript ?? document.createElement("script");

      const cleanup = () => {
        script.removeEventListener("load", handleLoad);
        script.removeEventListener("error", handleError);
      };

      const handleLoad = () => {
        cleanup();
        if (window.cloudinary) {
          resolve(window.cloudinary);
        } else {
          reject(
            new Error(
              "Cloudinary widget script loaded but window.cloudinary is undefined"
            )
          );
        }
      };

      const handleError = () => {
        cleanup();
        reject(new Error("Failed to load the Cloudinary upload widget"));
      };

      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);

      if (!existingScript) {
        script.async = true;
        script.src = CLOUDINARY_WIDGET_URL;
        script.setAttribute("data-cloudinary-upload-widget", "true");
        document.head.append(script);
      }
    }).catch((error) => {
      widgetLibraryPromise = null;
      throw error;
    });
  }

  return widgetLibraryPromise;
}

function toError(value: unknown, fallbackMessage: string): Error {
  if (value instanceof Error) {
    return value;
  }
  const detail =
    typeof value === "string" && value.trim()
      ? value
      : value != null
      ? String(value)
      : "";
  const message = detail ? `${fallbackMessage}: ${detail}` : fallbackMessage;
  return new Error(message);
}

export async function openCloudinaryUploadWidget(
  ownerId?: string
): Promise<{ fileId: string; href: string } | null> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary upload widget is not configured");
  }

  const cloudinary = await loadWidgetLibrary();

  return new Promise<{ fileId: string; href: string } | null>((resolve, reject) => {
    let settled = false;

    const options: Record<string, unknown> = {
      cloudName: CLOUDINARY_CLOUD_NAME,
      uploadPreset: CLOUDINARY_UPLOAD_PRESET,
      sources: ["local", "camera", "url"],
      multiple: false,
      resourceType: "image",
      singleUploadAutoClose: true,
    };

    if (CLOUDINARY_UPLOAD_FOLDER) {
      options.folder = CLOUDINARY_UPLOAD_FOLDER;
    }

    if (ownerId) {
      options.context = { owner_id: ownerId };
    }

    let widget: CloudinaryWidget;

    try {
      widget = cloudinary.createUploadWidget(options, (error, result) => {
        if (settled) {
          return;
        }

        if (error) {
          settled = true;
          widget.destroy();
          reject(toError(error, "Cloudinary upload failed"));
          return;
        }

        if (!result) {
          return;
        }

        if (result.event === "error") {
          settled = true;
          widget.destroy();
          const info = result.info;
          const rawMessage =
            info && typeof info === "object"
              ? (info as Record<string, unknown>).message
              : undefined;
          const message =
            typeof rawMessage === "string" && rawMessage.trim()
              ? rawMessage
              : null;
          reject(
            message
              ? new Error(`Cloudinary upload failed: ${message}`)
              : new Error("Cloudinary upload failed")
          );
          return;
        }

        if (result.event === "success" && result.info) {
          const info = result.info;
          if (typeof info !== "object") {
            settled = true;
            widget.destroy();
            reject(new Error("Cloudinary upload did not return file info"));
            return;
          }

          const href = info.secure_url ?? info.url;
          if (!href) {
            settled = true;
            widget.destroy();
            reject(new Error("Cloudinary upload did not include an image URL"));
            return;
          }

          const fileId = info.public_id ?? info.asset_id ?? href;
          settled = true;
          widget.destroy();
          resolve({ fileId, href });
          return;
        }

        if (result.event === "abort") {
          settled = true;
          widget.destroy();
          resolve(null);
          return;
        }

        if (result.event === "close") {
          settled = true;
          widget.destroy();
          resolve(null);
        }
      });
    } catch (creationError) {
      reject(toError(creationError, "Failed to initialize the Cloudinary upload widget"));
      return;
    }

    widget.open();
  });
}
