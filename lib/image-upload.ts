/**
 * Image upload utility functions
 * Provides image validation, compression, and base64 conversion for drop location photos
 */

/**
 * Maximum file size in bytes (5MB)
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Accepted image MIME types
 */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/**
 * Validates an image file against size and type constraints
 * @param file - File object to validate
 * @returns Object with isValid flag and optional error message
 * @example
 * ```ts
 * const result = validateImageFile(file);
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Please upload a JPEG, PNG, or WebP image.`,
    };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return {
      isValid: false,
      error: `File too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB.`,
    };
  }

  return { isValid: true };
}

/**
 * Converts a File object to a base64 data URL
 * @param file - Image file to convert
 * @returns Promise resolving to base64 data URL string
 * @example
 * ```ts
 * const base64 = await fileToBase64(file);
 * // Returns: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 * ```
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image file by resizing to max dimensions while maintaining aspect ratio
 * @param file - Image file to compress
 * @param maxWidth - Maximum width in pixels (default: 1920)
 * @param maxHeight - Maximum height in pixels (default: 1080)
 * @param quality - JPEG quality 0-1 (default: 0.85)
 * @returns Promise resolving to compressed base64 data URL
 * @example
 * ```ts
 * const compressed = await compressImage(file, 1200, 800, 0.8);
 * ```
 */
export function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with quality setting
        const mimeType = file.type || "image/jpeg";
        const base64 = canvas.toDataURL(mimeType, quality);
        resolve(base64);
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      if (typeof e.target?.result === "string") {
        img.src = e.target.result;
      } else {
        reject(new Error("Failed to read file"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Formats file size in bytes to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
