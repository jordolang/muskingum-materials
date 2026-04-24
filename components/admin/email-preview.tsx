"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmailPreviewProps {
  subject: string;
  htmlContent?: string;
  textContent?: string;
  className?: string;
}

export function EmailPreview({
  subject,
  htmlContent,
  textContent,
  className,
}: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<"html" | "text">("html");

  // Extract preview text from text content or strip HTML from html content
  const previewText = React.useMemo(() => {
    if (textContent) {
      return textContent.substring(0, 150) + (textContent.length > 150 ? "..." : "");
    }
    if (htmlContent) {
      // Strip HTML tags for preview
      const stripped = htmlContent.replace(/<[^>]*>/g, "");
      return stripped.substring(0, 150) + (stripped.length > 150 ? "..." : "");
    }
    return "";
  }, [textContent, htmlContent]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-xl">Email Preview</CardTitle>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Subject:</p>
              <p className="text-base font-semibold">{subject}</p>
            </div>
            {previewText && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Preview:</p>
                <p className="text-sm text-muted-foreground italic">{previewText}</p>
              </div>
            )}
          </div>
          {htmlContent && textContent && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewMode === "html" ? "default" : "outline"}
                onClick={() => setViewMode("html")}
              >
                HTML
              </Button>
              <Button
                size="sm"
                variant={viewMode === "text" ? "default" : "outline"}
                onClick={() => setViewMode("text")}
              >
                Text
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "html" && htmlContent ? (
          <div className="border rounded-md overflow-hidden">
            <iframe
              srcDoc={htmlContent}
              className="w-full min-h-[400px] bg-white"
              title="Email HTML Preview"
              sandbox="allow-same-origin"
            />
          </div>
        ) : viewMode === "text" && textContent ? (
          <div className="border rounded-md p-4 bg-muted/50">
            <pre className="whitespace-pre-wrap font-sans text-sm">{textContent}</pre>
          </div>
        ) : (
          <div className="border rounded-md p-8 text-center text-muted-foreground">
            <p>No {viewMode} content available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

EmailPreview.displayName = "EmailPreview";
