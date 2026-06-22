"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { deliveryConfigSchema, type DeliveryConfigData } from "@/lib/schemas";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

export function DeliveryConfigForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
    setValue,
    getValues,
  } = useForm<DeliveryConfigData>({
    resolver: zodResolver(deliveryConfigSchema),
    defaultValues: {
      availableDays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      },
      blackoutDates: [],
      slotsPerDay: 2,
      capacityPerSlot: 5,
      leadTimeDays: 2,
      timeWindows: [
        {
          key: "morning",
          label: "Morning (8am-12pm)",
          start: "08:00",
          end: "12:00",
        },
        {
          key: "afternoon",
          label: "Afternoon (1pm-5pm)",
          start: "13:00",
          end: "17:00",
        },
      ],
    },
  });

  const {
    fields: timeWindowFields,
    append: appendTimeWindow,
    remove: removeTimeWindow,
  } = useFieldArray({
    control,
    name: "timeWindows",
  });

  const availableDays = watch("availableDays");

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/admin/delivery-config");
        if (response.ok) {
          const data = await response.json();
          if (data.config) {
            reset(data.config);
            setBlackoutDates(data.config.blackoutDates || []);
          }
        }
      } catch {
        // Silently fail - use default values
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, [reset]);

  // Sync blackoutDates with form
  useEffect(() => {
    setValue("blackoutDates", blackoutDates);
  }, [blackoutDates, setValue]);

  function addBlackoutDate() {
    setBlackoutDates([...blackoutDates, ""]);
  }

  function updateBlackoutDate(index: number, value: string) {
    const updated = [...blackoutDates];
    updated[index] = value;
    setBlackoutDates(updated);
  }

  function removeBlackoutDate(index: number) {
    setBlackoutDates(blackoutDates.filter((_, i) => i !== index));
  }

  async function onSubmit(data: DeliveryConfigData) {
    setError("");
    try {
      const response = await fetch("/api/admin/delivery-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Submission failed");
      }

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Configuration Saved!</h3>
        <p className="text-muted-foreground mb-4">
          Delivery settings have been updated successfully.
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Continue Editing
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Available Days */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Available Delivery Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {DAYS.map((day) => (
              <div key={day.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${day.key}`}
                  checked={availableDays[day.key]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setValue(`availableDays.${day.key}`, e.target.checked)
                  }
                />
                <Label
                  htmlFor={`day-${day.key}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Capacity Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Capacity Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="slotsPerDay">Slots Per Day *</Label>
            <Input
              id="slotsPerDay"
              type="number"
              min={1}
              max={20}
              {...register("slotsPerDay", { valueAsNumber: true })}
            />
            {errors.slotsPerDay && (
              <p className="text-xs text-destructive mt-1">{errors.slotsPerDay.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="capacityPerSlot">Capacity Per Slot *</Label>
            <Input
              id="capacityPerSlot"
              type="number"
              min={1}
              max={50}
              {...register("capacityPerSlot", { valueAsNumber: true })}
            />
            {errors.capacityPerSlot && (
              <p className="text-xs text-destructive mt-1">{errors.capacityPerSlot.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="leadTimeDays">Lead Time (Days) *</Label>
            <Input
              id="leadTimeDays"
              type="number"
              min={0}
              max={30}
              {...register("leadTimeDays", { valueAsNumber: true })}
            />
            {errors.leadTimeDays && (
              <p className="text-xs text-destructive mt-1">{errors.leadTimeDays.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time Windows */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Time Windows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {timeWindowFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-12 sm:col-span-3 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Key *</Label>
                <Input
                  placeholder="morning"
                  {...register(`timeWindows.${index}.key`)}
                />
                {errors.timeWindows?.[index]?.key && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.timeWindows[index]?.key?.message}
                  </p>
                )}
              </div>
              <div className="col-span-12 sm:col-span-3 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Label *</Label>
                <Input
                  placeholder="Morning (8am-12pm)"
                  {...register(`timeWindows.${index}.label`)}
                />
                {errors.timeWindows?.[index]?.label && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.timeWindows[index]?.label?.message}
                  </p>
                )}
              </div>
              <div className="col-span-5 sm:col-span-2 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Start *</Label>
                <Input
                  type="time"
                  {...register(`timeWindows.${index}.start`)}
                />
                {errors.timeWindows?.[index]?.start && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.timeWindows[index]?.start?.message}
                  </p>
                )}
              </div>
              <div className="col-span-5 sm:col-span-2 space-y-1.5">
                <Label className="text-xs text-muted-foreground">End *</Label>
                <Input
                  type="time"
                  {...register(`timeWindows.${index}.end`)}
                />
                {errors.timeWindows?.[index]?.end && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.timeWindows[index]?.end?.message}
                  </p>
                )}
              </div>
              <div className="col-span-2 sm:col-span-2 flex items-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeTimeWindow(index)}
                  disabled={timeWindowFields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendTimeWindow({
                key: "",
                label: "",
                start: "09:00",
                end: "17:00",
              })
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Time Window
          </Button>
          {errors.timeWindows && typeof errors.timeWindows === "object" && "message" in errors.timeWindows && (
            <p className="text-xs text-destructive mt-1">{errors.timeWindows.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Blackout Dates */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Blackout Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {blackoutDates.length === 0 && (
            <p className="text-sm text-muted-foreground">No blackout dates configured.</p>
          )}
          {blackoutDates.map((date, index) => (
            <div key={index} className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => updateBlackoutDate(index, e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => removeBlackoutDate(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addBlackoutDate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Blackout Date
          </Button>
          {errors.blackoutDates && (
            <p className="text-xs text-destructive mt-1">
              {typeof errors.blackoutDates === "object" && "message" in errors.blackoutDates
                ? errors.blackoutDates.message
                : "Invalid blackout dates"}
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving Configuration...
          </>
        ) : (
          "Save Configuration"
        )}
      </Button>
    </form>
  );
}
