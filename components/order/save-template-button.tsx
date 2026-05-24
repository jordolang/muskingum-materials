"use client";

import { useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaveTemplateButtonProps {
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  pickupOrDeliver: string;
  deliveryAddress: string | null;
}

export function SaveTemplateButton({
  items,
  pickupOrDeliver,
  deliveryAddress,
}: SaveTemplateButtonProps) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleSaveAsTemplate() {
    const templateName = window.prompt("Enter a name for this template:");
    if (!templateName || templateName.trim() === "") {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/account/saved-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          items,
          pickupOrDeliver,
          deliveryAddress,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save template");
      }

      alert(`Template "${templateName}" saved successfully!`);
    } catch (error) {
      alert("Failed to save template. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1"
      onClick={handleSaveAsTemplate}
      disabled={isSaving}
    >
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4" />
          Save as Template
        </>
      )}
    </Button>
  );
}
