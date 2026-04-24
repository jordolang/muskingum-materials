import * as React from "react";
import { Clock, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderStatusHistoryEntry {
  id: string;
  status: string;
  notes?: string | null;
  changedBy?: string | null;
  createdAt: Date;
}

interface OrderStatusTimelineProps {
  statusHistory: OrderStatusHistoryEntry[];
  currentStatus: string;
  className?: string;
}

export function OrderStatusTimeline({
  statusHistory,
  currentStatus,
  className,
}: OrderStatusTimelineProps) {
  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No status history available
      </div>
    );
  }

  // Sort by createdAt descending (most recent first)
  const sortedHistory = [...statusHistory].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className={cn("space-y-4", className)}>
      {sortedHistory.map((entry, index) => {
        const isCurrentStatus = entry.status === currentStatus;
        const isMostRecent = index === 0;

        return (
          <div key={entry.id} className="flex gap-3">
            {/* Timeline indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2",
                  isCurrentStatus
                    ? "border-amber-600 bg-amber-50"
                    : "border-muted bg-background"
                )}
              >
                {isCurrentStatus ? (
                  <CheckCircle2 className="h-4 w-4 text-amber-600" />
                ) : (
                  <Circle className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              {index < sortedHistory.length - 1 && (
                <div className="h-full w-0.5 flex-1 bg-border my-1 min-h-[20px]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={entry.status} />
                    {isMostRecent && (
                      <span className="text-xs text-muted-foreground italic">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(entry.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      {entry.notes}
                    </p>
                  )}
                  {entry.changedBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated by: {entry.changedBy}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<
    string,
    { label: string; className: string }
  > = {
    pending: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800",
    },
    confirmed: {
      label: "Confirmed",
      className: "bg-blue-100 text-blue-800",
    },
    processing: {
      label: "Processing",
      className: "bg-purple-100 text-purple-800",
    },
    ready: {
      label: "Ready",
      className: "bg-green-100 text-green-800",
    },
    ready_for_pickup: {
      label: "Ready for Pickup",
      className: "bg-green-100 text-green-800",
    },
    out_for_delivery: {
      label: "Out for Delivery",
      className: "bg-blue-100 text-blue-800",
    },
    completed: {
      label: "Completed",
      className: "bg-green-100 text-green-800",
    },
    canceled: {
      label: "Canceled",
      className: "bg-red-100 text-red-800",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-red-100 text-red-800",
    },
  };

  const config = statusMap[status] || {
    label: status,
    className: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
