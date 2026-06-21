"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  validateImageFile,
  compressImage,
  formatFileSize,
  MAX_IMAGE_SIZE,
  ACCEPTED_IMAGE_TYPES,
} from "@/lib/image-upload";
import { Button } from "@/components/ui/button";

export interface ImageUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Current image value (base64 data URL or regular URL)
   */
  value?: string;
  /**
   * Callback when image changes
   * @param value - Base64 data URL of the uploaded image, or undefined if cleared
   */
  onChange?: (value: string | undefined) => void;
  /**
   * Whether to compress images before upload (default: true)
   */
  compress?: boolean;
  /**
   * Maximum width for compression (default: 1920)
   */
  maxWidth?: number;
  /**
   * Maximum height for compression (default: 1080)
   */
  maxHeight?: number;
  /**
   * JPEG quality for compression 0-1 (default: 0.85)
   */
  quality?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  /**
   * Placeholder text when no image is selected
   */
  placeholder?: string;
}

/**
 * Image upload component with preview, validation, and optional compression
 * Returns base64 data URL for easy storage in database
 *
 * @example
 * ```tsx
 * <ImageUpload
 *   value={formData.photo}
 *   onChange={(base64) => setFormData({ ...formData, photo: base64 })}
 *   placeholder="Upload drop location photo"
 * />
 * ```
 */
export const ImageUpload = React.forwardRef<HTMLDivElement, ImageUploadProps>(
  (
    {
      value,
      onChange,
      compress = true,
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.85,
      className,
      disabled = false,
      placeholder = "Upload an image",
      ...props
    },
    ref
  ) => {
    const [error, setError] = React.useState<string | undefined>();
    const [loading, setLoading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setError(undefined);
      setLoading(true);

      try {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          setError(validation.error);
          setLoading(false);
          return;
        }

        // Compress or convert to base64
        let base64: string;
        if (compress) {
          base64 = await compressImage(file, maxWidth, maxHeight, quality);
        } else {
          const reader = new FileReader();
          base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
          });
        }

        onChange?.(base64);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to process image"
        );
      } finally {
        setLoading(false);
      }
    };

    const handleClear = () => {
      setError(undefined);
      onChange?.(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const handleClick = () => {
      if (!disabled) {
        fileInputRef.current?.click();
      }
    };

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {/* Preview or upload area */}
        <div
          className={cn(
            "relative flex min-h-[200px] w-full items-center justify-center rounded-md border-2 border-dashed border-input bg-background transition-colors",
            !disabled && "cursor-pointer hover:border-primary hover:bg-accent",
            disabled && "cursor-not-allowed opacity-50",
            error && "border-destructive"
          )}
          onClick={handleClick}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Processing image...</p>
            </div>
          ) : value ? (
            <div className="relative w-full p-2">
              <img
                src={value}
                alt="Preview"
                className="mx-auto max-h-[400px] rounded-md object-contain"
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute right-4 top-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <svg
                className="h-12 w-12 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div className="space-y-1">
                <p className="text-sm font-medium">{placeholder}</p>
                <p className="text-xs text-muted-foreground">
                  Click to browse or drag and drop
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />

        {/* Error message */}
        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}

        {/* Info text */}
        {!error && !value && (
          <p className="text-xs text-muted-foreground">
            Accepted formats: JPEG, PNG, WebP. Max size:{" "}
            {formatFileSize(MAX_IMAGE_SIZE)}.
          </p>
        )}
      </div>
    );
  }
);

ImageUpload.displayName = "ImageUpload";
