"use client";

import { useCallback } from "react";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { CheckoutData } from "./order-form";

interface TimeWindow {
  key: string;
  label: string;
}

interface PickupSlot {
  date: string; // ISO date string (YYYY-MM-DD)
  dateDisplay: string; // Human-readable date (e.g., "Fri, Jun 27")
}

interface PickupSchedulerProps {
  setValue: UseFormSetValue<CheckoutData>;
  watch: UseFormWatch<CheckoutData>;
}

// Predefined time windows for pickup (no capacity tracking)
const TIME_WINDOWS: TimeWindow[] = [
  { key: "morning", label: "Morning (8am-12pm)" },
  { key: "afternoon", label: "Afternoon (12pm-4pm)" },
];

export function PickupScheduler({ setValue, watch }: PickupSchedulerProps) {
  const selectedDate = watch("pickupDate");
  const selectedWindow = watch("pickupTimeWindow");

  // Generate next 14 days of pickup slots (excluding weekends for simplicity)
  const slots: PickupSlot[] = [];
  const today = new Date();
  let daysAdded = 0;
  const currentDate = new Date(today);

  while (daysAdded < 14) {
    currentDate.setDate(today.getDate() + daysAdded);
    const dayOfWeek = currentDate.getDay();

    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dateDisplay = currentDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      slots.push({
        date: dateStr,
        dateDisplay,
      });
    }

    daysAdded++;
  }

  // Handle date selection
  const handleDateSelect = useCallback(
    (dateStr: string) => {
      setValue("pickupDate", dateStr);
      // Clear time window when changing date
      setValue("pickupTimeWindow", undefined);
    },
    [setValue],
  );

  // Handle time window selection
  const handleWindowSelect = useCallback(
    (windowKey: string) => {
      setValue("pickupTimeWindow", windowKey);
    },
    [setValue],
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <h4 className="font-medium">Schedule Pickup Time (Optional)</h4>
      </div>

      <div className="rounded-lg bg-muted/50 p-3 text-sm">
        <p className="text-muted-foreground">
          Select a preferred date and time to pick up your materials. If you
          don&apos;t select a time, you can arrange pickup when your order is ready.
        </p>
      </div>

      {/* Date Selection - Mobile Dropdown */}
      <div className="md:hidden">
        <label
          htmlFor="pickup-date-select"
          className="text-sm font-medium mb-2 block"
        >
          Pickup Date
        </label>
        <Select value={selectedDate} onValueChange={handleDateSelect}>
          <SelectTrigger id="pickup-date-select">
            <SelectValue placeholder="Select a pickup date" />
          </SelectTrigger>
          <SelectContent>
            {slots.map((slot) => (
              <SelectItem key={slot.date} value={slot.date}>
                {slot.dateDisplay}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Selection - Desktop Grid */}
      <div className="hidden md:block">
        <label className="text-sm font-medium mb-2 block">Pickup Date</label>
        <div className="grid grid-cols-5 gap-2">
          {slots.map((slot) => {
            const isSelected = slot.date === selectedDate;
            const date = new Date(slot.date);
            const dayOfWeek = date.getDay();

            return (
              <Button
                key={slot.date}
                type="button"
                variant={isSelected ? "default" : "outline"}
                className="h-auto flex-col items-start p-2"
                onClick={() => handleDateSelect(slot.date)}
              >
                <span className="text-xs text-muted-foreground">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek]}
                </span>
                <span className="text-lg font-semibold">{date.getDate()}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Time Window Selection */}
      {selectedDate && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium">Time Window</label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TIME_WINDOWS.map((window) => {
              const isSelected = window.key === selectedWindow;
              return (
                <Button
                  key={window.key}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className="h-auto flex-col items-start p-4"
                  onClick={() => handleWindowSelect(window.key)}
                >
                  <span className="font-medium">{window.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedDate && selectedWindow && (
        <div className="rounded-lg bg-primary/10 p-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
          <Calendar className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">
              Pickup scheduled for{" "}
              {slots.find((s) => s.date === selectedDate)?.dateDisplay}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {TIME_WINDOWS.find((w) => w.key === selectedWindow)?.label}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
