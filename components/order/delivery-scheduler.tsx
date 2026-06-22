"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  available: number;
  total: number;
  disabled: boolean;
}

interface AvailableSlot {
  date: string; // ISO date string (YYYY-MM-DD)
  dateDisplay: string; // Human-readable date (e.g., "Fri, Jun 27")
  windows: TimeWindow[];
}

interface DeliverySchedulerProps {
  setValue: UseFormSetValue<CheckoutData>;
  watch: UseFormWatch<CheckoutData>;
}

export function DeliveryScheduler({
  setValue,
  watch,
}: DeliverySchedulerProps) {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadTimeDays, setLeadTimeDays] = useState(2);

  const selectedDate = watch("deliveryDate");
  const selectedWindow = watch("deliveryTimeWindow");

  // Fetch available slots from API
  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const startDate = today.toISOString().split("T")[0];
      const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const res = await fetch(
        `/api/delivery/availability?startDate=${startDate}&endDate=${endDate}`,
      );

      if (!res.ok) {
        throw new Error("Failed to load delivery availability");
      }

      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load delivery availability",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  // Handle date selection
  const handleDateSelect = useCallback(
    (dateStr: string) => {
      setValue("deliveryDate", dateStr);
      // Clear time window when changing date
      setValue("deliveryTimeWindow", undefined);
    },
    [setValue],
  );

  // Handle time window selection
  const handleWindowSelect = useCallback(
    (windowKey: string) => {
      setValue("deliveryTimeWindow", windowKey);
    },
    [setValue],
  );

  // Find the selected slot
  const selectedSlot = slots.find((slot) => slot.date === selectedDate);

  // Group slots by week for display
  const weekGroups = slots.reduce(
    (groups, slot) => {
      const date = new Date(slot.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!groups[weekKey]) {
        groups[weekKey] = [];
      }
      groups[weekKey].push(slot);
      return groups;
    },
    {} as Record<string, AvailableSlot[]>,
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <h4 className="font-medium">Schedule Delivery</h4>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading available dates...
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Unable to load delivery availability
            </p>
            <p className="text-xs text-destructive/80 mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSlots}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {!loading && !error && slots.length === 0 && (
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No delivery slots currently available. Please contact us to schedule
            your delivery.
          </p>
        </div>
      )}

      {!loading && !error && slots.length > 0 && (
        <>
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="text-muted-foreground">
              <strong className="text-foreground">
                {leadTimeDays}-day lead time required
              </strong>
              <br />
              Select a delivery date and time window. Available slots are shown
              below.
            </p>
          </div>

          {/* Date Selection - Mobile Dropdown */}
          <div className="md:hidden">
            <label
              htmlFor="delivery-date-select"
              className="text-sm font-medium mb-2 block"
            >
              Delivery Date *
            </label>
            <Select value={selectedDate} onValueChange={handleDateSelect}>
              <SelectTrigger id="delivery-date-select">
                <SelectValue placeholder="Select a delivery date" />
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

          {/* Date Selection - Desktop Calendar Grid */}
          <div className="hidden md:block">
            <label className="text-sm font-medium mb-2 block">
              Delivery Date *
            </label>
            <div className="space-y-4">
              {Object.entries(weekGroups).map(([weekKey, weekSlots]) => (
                <div key={weekKey}>
                  <p className="text-xs text-muted-foreground mb-2">
                    Week of{" "}
                    {new Date(weekKey).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <div className="grid grid-cols-7 gap-2">
                    {weekSlots.map((slot) => {
                      const hasCapacity = slot.windows.some(
                        (w) => !w.disabled,
                      );
                      const isSelected = slot.date === selectedDate;
                      const date = new Date(slot.date);
                      const dayOfWeek = date.getDay();

                      return (
                        <Button
                          key={slot.date}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "h-auto flex-col items-start p-2",
                            !hasCapacity && "opacity-50 cursor-not-allowed",
                          )}
                          onClick={() =>
                            hasCapacity && handleDateSelect(slot.date)
                          }
                          disabled={!hasCapacity}
                        >
                          <span className="text-xs text-muted-foreground">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                              dayOfWeek
                            ]}
                          </span>
                          <span className="text-lg font-semibold">
                            {date.getDate()}
                          </span>
                          {hasCapacity && (
                            <Badge
                              variant="secondary"
                              className="text-xs mt-1 px-1"
                            >
                              {slot.windows.filter((w) => !w.disabled).length}{" "}
                              slot
                              {slot.windows.filter((w) => !w.disabled).length !==
                              1
                                ? "s"
                                : ""}
                            </Badge>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time Window Selection */}
          {selectedSlot && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Time Window *</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedSlot.windows.map((window) => {
                  const isSelected = window.key === selectedWindow;
                  return (
                    <Button
                      key={window.key}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "h-auto flex-col items-start p-4",
                        window.disabled && "opacity-50 cursor-not-allowed",
                      )}
                      onClick={() =>
                        !window.disabled && handleWindowSelect(window.key)
                      }
                      disabled={window.disabled}
                    >
                      <span className="font-medium">{window.label}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {window.disabled ? (
                          "Fully booked"
                        ) : (
                          <>
                            {window.available} of {window.total} slots available
                          </>
                        )}
                      </span>
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
                  Delivery scheduled for {selectedSlot?.dateDisplay}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {
                    selectedSlot?.windows.find((w) => w.key === selectedWindow)
                      ?.label
                  }
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
