const CLOUDINARY_WIDGET_URL = "https://widget.cloudinary.com/v2.0/global/all.js";
const CLOUDINARY_CLOUD_NAME = import.meta.env
  .VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env
  .VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
const CLOUDINARY_UPLOAD_FOLDER = import.meta.env
  .VITE_CLOUDINARY_UPLOAD_FOLDER as string | undefined;
const CLOUDINARY_UPLOAD_URL = CLOUDINARY_CLOUD_NAME
  ? `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`
  : null;

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

type CloudinaryUploadResponse = {
  asset_id?: string;
  public_id?: string;
  secure_url?: string;
  url?: string;
  error?: {
    message?: string;
  };
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

function extractUploadErrorMessage(
  payload: CloudinaryUploadResponse | null
): string | null {
  if (!payload) {
    return null;
  }

  const error = payload.error;
  if (!error || typeof error !== "object") {
    return null;
  }

  const message = (error as { message?: unknown }).message;
  if (typeof message === "string") {
    const trimmed = message.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

export async function uploadImageFile(
  file: File,
  ownerId?: string
): Promise<{ fileId: string; href: string }> {
  if (!isCloudinaryConfigured() || !CLOUDINARY_UPLOAD_URL) {
    throw new Error("Cloudinary upload widget is not configured");
  }

  if (typeof fetch !== "function") {
    throw new Error("Cloudinary uploads require the Fetch API in the browser");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET!);

  if (CLOUDINARY_UPLOAD_FOLDER) {
    formData.append("folder", CLOUDINARY_UPLOAD_FOLDER);
  }

  if (ownerId) {
    formData.append("context", `owner_id=${ownerId}`);
  }

  let response: Response;
  try {
    response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });
  } catch (networkError) {
    throw toError(networkError, "Failed to upload image to Cloudinary");
  }

  let responseText: string | null = null;
  try {
    responseText = await response.text();
  } catch {
    responseText = null;
  }

  let payload: CloudinaryUploadResponse | null = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText) as CloudinaryUploadResponse;
    } catch {
      payload = null;
    }
  }

  const responseErrorMessage =
    extractUploadErrorMessage(payload) ||
    (responseText && responseText.trim() ? responseText.trim() : null) ||
    response.statusText;

  if (!response.ok) {
    throw new Error(
      responseErrorMessage
        ? `Failed to upload image to Cloudinary: ${responseErrorMessage}`
        : "Failed to upload image to Cloudinary"
    );
  }

  if (!payload) {
    throw new Error("Cloudinary upload response was empty");
  }

  const href = payload.secure_url ?? payload.url;
  if (!href) {
    throw new Error(
      responseErrorMessage
        ? `Cloudinary upload response did not include an image URL: ${responseErrorMessage}`
        : "Cloudinary upload response did not include an image URL"
    );
  }

  const fileId = payload.public_id ?? payload.asset_id ?? href;
  return { fileId, href };
}

export async function openCloudinaryUploadWidget(
  ownerId?: string
): Promise<{ fileId: string; href: string } | null> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary upload widget is not configured");
  }

  const cloudinary = await loadWidgetLibrary();

  return new Promise<{ fileId: string; href: string } | null>((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(
        new Error("Cloudinary upload widget is only available in the browser")
      );
      return;
    }

    const captureStyles = (element: HTMLElement, properties: string[]) =>
      properties.map<[string, string]>((property) => [
        property,
        element.style.getPropertyValue(property),
      ]);

    const restoreStyles = (
      element: HTMLElement,
      entries: Array<[string, string]>
    ) => {
      for (const [property, value] of entries) {
        if (value) {
          element.style.setProperty(property, value);
        } else {
          element.style.removeProperty(property);
        }
      }
    };

    const body = document.body;
    const html = document.documentElement;
    const bodyStyles = captureStyles(body, [
      "overflow",
      "overflow-x",
      "overflow-y",
      "padding-right",
    ]);
    const htmlStyles = captureStyles(html, [
      "overflow",
      "overflow-x",
      "overflow-y",
      "padding-right",
    ]);

    const restoreScrollState = () => {
      const apply = () => {
        restoreStyles(body, bodyStyles);
        restoreStyles(html, htmlStyles);
      };

      if (
        typeof window !== "undefined" &&
        typeof window.requestAnimationFrame === "function"
      ) {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(apply);
        });
      } else {
        setTimeout(apply, 0);
      }
    };

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

    let widget: CloudinaryWidget | null = null;

    const finalize = (callback: () => void) => {
      if (settled) {
        return;
      }
      settled = true;

      try {
        widget?.destroy();
      } catch {
        // Ignore errors that happen while cleaning up the widget instance.
      } finally {
        widget = null;
      }

      try {
        callback();
      } finally {
        restoreScrollState();
      }
    };

    try {
      widget = cloudinary.createUploadWidget(options, (error, result) => {
        if (settled) {
          return;
        }

        if (error) {
          finalize(() => {
            reject(toError(error, "Cloudinary upload failed"));
          });
          return;
        }

        if (!result) {
          return;
        }

        if (result.event === "error") {
          finalize(() => {
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
          });
          return;
        }

        if (result.event === "success") {
          const info = result.info;
          if (!info || typeof info !== "object") {
            finalize(() => {
              reject(new Error("Cloudinary upload did not return file info"));
            });
            return;
          }

          const details = info as CloudinaryWidgetInfo;
          const href = details.secure_url ?? details.url;
          if (!href) {
            finalize(() => {
              reject(new Error("Cloudinary upload did not include an image URL"));
            });
            return;
          }

          const fileId = details.public_id ?? details.asset_id ?? href;
          finalize(() => {
            resolve({ fileId, href });
          });
          return;
        }

        if (result.event === "abort" || result.event === "close") {
          finalize(() => {
            resolve(null);
          });
        }
      });
    } catch (creationError) {
      finalize(() => {
        reject(
          toError(
            creationError,
            "Failed to initialize the Cloudinary upload widget"
          )
        );
      });
      return;
    }

    if (!widget) {
      finalize(() => {
        reject(new Error("Failed to initialize the Cloudinary upload widget"));
      });
      return;
    }

    try {
      widget.open();
    } catch (openError) {
      finalize(() => {
        reject(toError(openError, "Failed to open the Cloudinary upload widget"));
      });
    }
  });
}
