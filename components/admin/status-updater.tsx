"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface StatusOption {
  value: string;
  label: string;
}

interface StatusUpdaterProps {
  currentStatus: string;
  statusOptions: StatusOption[];
  resourceId: string;
  resourceType: "orders" | "leads" | "quotes" | "chats";
  onStatusUpdate?: (newStatus: string) => void;
}

export function StatusUpdater({
  currentStatus,
  statusOptions,
  resourceId,
  resourceType,
  onStatusUpdate,
}: StatusUpdaterProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = status !== currentStatus;

  async function handleUpdate() {
    if (!hasChanges) return;

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/${resourceType}/${resourceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      // Call optional callback
      onStatusUpdate?.(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
      // Revert to current status on error
      setStatus(currentStatus);
    } finally {
      setIsUpdating(false);
    }
  }

  function handleCancel() {
    setStatus(currentStatus);
    setError(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={setStatus} disabled={isUpdating}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasChanges && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              size="sm"
              className="min-w-[80px]"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isUpdating}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
