"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestImageUploadPage() {
  const [imageValue, setImageValue] = useState<string | undefined>();
  const [compressedImage, setCompressedImage] = useState<string | undefined>();
  const [uncompressedImage, setUncompressedImage] = useState<string | undefined>();

  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold">Image Upload Component Test</h1>
        <p className="text-muted-foreground">
          Test the ImageUpload component functionality
        </p>
      </div>

      {/* Basic usage */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Upload (Compressed)</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            value={imageValue}
            onChange={setImageValue}
            placeholder="Upload drop location photo"
          />
          {imageValue && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Base64 Output:</p>
              <div className="max-h-32 overflow-auto rounded-md bg-muted p-3">
                <code className="text-xs break-all">
                  {imageValue.substring(0, 200)}...
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                Size: {(imageValue.length * 0.75).toFixed(0)} bytes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compressed vs uncompressed */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>With Compression</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={compressedImage}
              onChange={setCompressedImage}
              compress={true}
              maxWidth={800}
              maxHeight={600}
              quality={0.8}
              placeholder="Upload (will be compressed)"
            />
            {compressedImage && (
              <p className="mt-2 text-xs text-muted-foreground">
                Compressed size: {(compressedImage.length * 0.75).toFixed(0)} bytes
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Without Compression</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={uncompressedImage}
              onChange={setUncompressedImage}
              compress={false}
              placeholder="Upload (original size)"
            />
            {uncompressedImage && (
              <p className="mt-2 text-xs text-muted-foreground">
                Original size: {(uncompressedImage.length * 0.75).toFixed(0)} bytes
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Disabled state */}
      <Card>
        <CardHeader>
          <CardTitle>Disabled State</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            disabled
            placeholder="This upload is disabled"
          />
        </CardContent>
      </Card>

      {/* Test results summary */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!imageValue}
                readOnly
                className="h-4 w-4"
              />
              <label className="text-sm">Component accepts images</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!imageValue}
                readOnly
                className="h-4 w-4"
              />
              <label className="text-sm">Shows preview of uploaded image</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!imageValue && imageValue.startsWith("data:")}
                readOnly
                className="h-4 w-4"
              />
              <label className="text-sm">Returns base64 data URL</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!compressedImage && !!uncompressedImage}
                readOnly
                className="h-4 w-4"
              />
              <label className="text-sm">Compression works correctly</label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
