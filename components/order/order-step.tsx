"use client";

import { ReactNode } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrderStepStatus = "locked" | "active" | "complete";

interface OrderStepProps {
  stepNumber: number;
  title: string;
  subtitle?: string;
  status: OrderStepStatus;
  lockedMessage?: string;
  badge?: ReactNode;
  children: ReactNode;
}

const RING_BY_STATUS: Record<OrderStepStatus, string> = {
  locked: "bg-muted text-muted-foreground ring-muted",
  active: "bg-amber-500 text-white ring-amber-200",
  complete: "bg-emerald-500 text-white ring-emerald-200",
};

export function OrderStep({
  stepNumber,
  title,
  subtitle,
  status,
  lockedMessage,
  badge,
  children,
}: OrderStepProps) {
  const isLocked = status === "locked";
  const isComplete = status === "complete";

  return (
    <div
      role="group"
      aria-disabled={isLocked}
      className={cn(
        "relative rounded-2xl border bg-card shadow-sm transition-all duration-500",
        isLocked && "opacity-60",
        isComplete && "border-emerald-500/40",
        !isLocked && !isComplete && "border-amber-500/40 shadow-md",
      )}
    >
      {/* Connector line to next step */}
      <div
        className={cn(
          "absolute left-9 -bottom-4 h-4 w-px bg-border transition-colors duration-500",
          isComplete && "bg-emerald-500",
        )}
        aria-hidden="true"
      />

      <header className="flex items-center gap-4 border-b border-border/60 p-5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm ring-4 transition-colors duration-500",
            RING_BY_STATUS[status],
          )}
        >
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : isLocked ? (
            <Lock className="h-4 w-4" />
          ) : (
            stepNumber
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-lg font-bold leading-tight">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        {badge && <div className="shrink-0">{badge}</div>}
      </header>

      <div
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-500 ease-out",
          isLocked ? "max-h-24" : "max-h-[6000px]",
        )}
      >
        {isLocked ? (
          <div className="flex items-center justify-center px-5 py-6 text-sm text-muted-foreground">
            <Lock className="mr-2 h-4 w-4" />
            {lockedMessage ?? "Complete the previous step to unlock."}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-top-2 duration-500">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
