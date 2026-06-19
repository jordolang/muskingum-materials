"use client";

import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DeliveryAccessChecklistData {
  drivewayWidth?: "10ft_or_more" | "less_than_10ft" | "unknown";
  overheadClearance?: "14ft_or_more" | "less_than_14ft" | "unknown";
  turningRoom?: "adequate" | "tight" | "unknown";
  surface?: "paved" | "gravel" | "dirt" | "grass" | "other";
  gateCode?: string;
  accessInstructions?: string;
}

interface DeliveryAccessChecklistProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
}

export function DeliveryAccessChecklist({
  register,
  watch,
  setValue,
  errors,
}: DeliveryAccessChecklistProps) {
  const drivewayWidth = watch("deliveryAccessChecklist.drivewayWidth");
  const overheadClearance = watch("deliveryAccessChecklist.overheadClearance");
  const turningRoom = watch("deliveryAccessChecklist.turningRoom");
  const surface = watch("deliveryAccessChecklist.surface");

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-foreground">Delivery Access Check</h4>
          <p className="text-sm text-muted-foreground">
            Help us ensure our truck can safely access your delivery site.
            Standard dump trucks are approximately 8-9 feet wide and 13-14 feet tall.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="checklist-driveway-width"
            className="text-sm font-medium mb-1 block"
          >
            Driveway Width
          </label>
          <Select
            value={drivewayWidth || ""}
            onValueChange={(value) =>
              setValue("deliveryAccessChecklist.drivewayWidth", value)
            }
          >
            <SelectTrigger id="checklist-driveway-width">
              <SelectValue placeholder="Select driveway width" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10ft_or_more">10 feet or more (Standard)</SelectItem>
              <SelectItem value="less_than_10ft">Less than 10 feet (Narrow)</SelectItem>
              <SelectItem value="unknown">Not sure</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Measure the narrowest point of your driveway or access path
          </p>
        </div>

        <div>
          <label
            htmlFor="checklist-overhead-clearance"
            className="text-sm font-medium mb-1 block"
          >
            Overhead Clearance
          </label>
          <Select
            value={overheadClearance || ""}
            onValueChange={(value) =>
              setValue("deliveryAccessChecklist.overheadClearance", value)
            }
          >
            <SelectTrigger id="checklist-overhead-clearance">
              <SelectValue placeholder="Select overhead clearance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="14ft_or_more">14 feet or more (Standard)</SelectItem>
              <SelectItem value="less_than_14ft">Less than 14 feet (Low)</SelectItem>
              <SelectItem value="unknown">Not sure</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Check for low-hanging branches, power lines, or structures
          </p>
        </div>

        <div>
          <label
            htmlFor="checklist-turning-room"
            className="text-sm font-medium mb-1 block"
          >
            Turning Room
          </label>
          <Select
            value={turningRoom || ""}
            onValueChange={(value) =>
              setValue("deliveryAccessChecklist.turningRoom", value)
            }
          >
            <SelectTrigger id="checklist-turning-room">
              <SelectValue placeholder="Select turning room" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="adequate">Adequate room to turn around</SelectItem>
              <SelectItem value="tight">Limited turning space</SelectItem>
              <SelectItem value="unknown">Not sure</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Our trucks need space to maneuver for safe delivery
          </p>
        </div>

        <div>
          <label
            htmlFor="checklist-surface"
            className="text-sm font-medium mb-1 block"
          >
            Ground Surface
          </label>
          <Select
            value={surface || ""}
            onValueChange={(value) =>
              setValue("deliveryAccessChecklist.surface", value)
            }
          >
            <SelectTrigger id="checklist-surface">
              <SelectValue placeholder="Select ground surface type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paved">Paved (asphalt or concrete)</SelectItem>
              <SelectItem value="gravel">Gravel</SelectItem>
              <SelectItem value="dirt">Dirt or clay</SelectItem>
              <SelectItem value="grass">Grass or lawn</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Heavy trucks may damage soft or wet surfaces
          </p>
        </div>

        <div>
          <label
            htmlFor="checklist-gate-code"
            className="text-sm font-medium mb-1 block"
          >
            Gate Code or Access Code (if applicable)
          </label>
          <Input
            id="checklist-gate-code"
            placeholder="e.g., #1234"
            {...register("deliveryAccessChecklist.gateCode")}
          />
        </div>

        <div>
          <label
            htmlFor="checklist-access-instructions"
            className="text-sm font-medium mb-1 block"
          >
            Additional Access Instructions
          </label>
          <Textarea
            id="checklist-access-instructions"
            placeholder="e.g., Use side entrance, watch for low mailbox, park on street..."
            rows={3}
            {...register("deliveryAccessChecklist.accessInstructions")}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Include any special instructions to help our driver find and access your site
          </p>
        </div>
      </div>
    </div>
  );
}
