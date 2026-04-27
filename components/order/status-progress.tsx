import * as React from "react";
import { CheckCircle2, Circle, Package, Truck, CircleCheckBig } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusProgressProps {
  currentStatus: string;
  className?: string;
}

interface Step {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Define the order lifecycle steps
const steps: Step[] = [
  { id: "confirmed", label: "Confirmed", icon: CircleCheckBig },
  { id: "processing", label: "Processing", icon: Package },
  { id: "ready", label: "Ready", icon: CheckCircle2 },
  { id: "delivery", label: "Delivery/Pickup", icon: Truck },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

// Map status values to step indices
const statusToStepIndex: Record<string, number> = {
  pending: -1,
  confirmed: 0,
  processing: 1,
  ready: 2,
  ready_for_pickup: 3,
  out_for_delivery: 3,
  completed: 4,
  canceled: -1,
  cancelled: -1,
};

export function StatusProgress({ currentStatus, className }: StatusProgressProps) {
  const currentStepIndex = statusToStepIndex[currentStatus] ?? -1;
  const isCancelled = currentStatus === "canceled" || currentStatus === "cancelled";

  if (isCancelled) {
    return (
      <div className={cn("text-center py-4", className)}>
        <p className="text-sm text-red-600 font-medium">Order Cancelled</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;
          const isLast = index === steps.length - 1;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div className="flex flex-col items-center gap-2 flex-1">
                {/* Icon circle */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted && "border-green-600 bg-green-50",
                    isCurrent && "border-amber-600 bg-amber-50",
                    isPending && "border-gray-300 bg-gray-50"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isCurrent && "text-amber-600",
                        isPending && "text-gray-400"
                      )}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="text-center">
                  <p
                    className={cn(
                      "text-xs font-medium",
                      isCompleted && "text-green-700",
                      isCurrent && "text-amber-700",
                      isPending && "text-gray-500"
                    )}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-[10px] text-amber-600 mt-0.5">Current</p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 h-0.5 mb-8 mx-2">
                  <div
                    className={cn(
                      "h-full transition-colors",
                      index < currentStepIndex ? "bg-green-600" : "bg-gray-300"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Status-specific message */}
      {currentStepIndex >= 0 && (
        <div className="mt-4 text-center">
          <StatusMessage status={currentStatus} />
        </div>
      )}
    </div>
  );
}

function StatusMessage({ status }: { status: string }) {
  const messages: Record<string, string> = {
    confirmed: "Your order has been confirmed and will be processed soon.",
    processing: "Your order is being prepared for delivery or pickup.",
    ready: "Your order is ready!",
    ready_for_pickup: "Your order is ready for pickup at our location.",
    out_for_delivery: "Your order is on the way to your location.",
    completed: "Your order has been completed. Thank you!",
  };

  const message = messages[status];

  if (!message) return null;

  return <p className="text-sm text-muted-foreground">{message}</p>;
}
