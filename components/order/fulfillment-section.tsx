"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useState, useCallback } from "react";
import {
  UseFormRegister,
  UseFormWatch,
  FieldErrors,
  UseFormSetValue,
} from "react-hook-form";
import { MapPin, Truck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BUSINESS_INFO } from "@/data/business";
import { cn } from "@/lib/utils";
import type { CheckoutData } from "./order-form";
import { DeliveryAccessChecklist } from "./delivery-access-checklist";

interface SavedAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

interface FulfillmentSectionProps {
  register: UseFormRegister<CheckoutData>;
  watch: UseFormWatch<CheckoutData>;
  errors: FieldErrors<CheckoutData>;
  setValue: UseFormSetValue<CheckoutData>;
  prefillAddress?: string;
}

export function FulfillmentSection({
  register,
  watch,
  errors,
  setValue,
  prefillAddress,
}: FulfillmentSectionProps) {
  const { user, isLoaded } = useUser();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const deliveryAddressRef = useRef<HTMLTextAreaElement | null>(null);
  const fulfillment = watch("fulfillment");
  const hasPrefilled = useRef(false);

  // Pull saved addresses for signed-in users
  const loadAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/account/profile");
      const data = await res.json();
      setSavedAddresses(data.profile?.addresses || []);
    } catch {
      // Ignore — we still let the user enter manually.
    }
  }, []);

  useEffect(() => {
    if (isLoaded && user) loadAddresses();
  }, [isLoaded, user, loadAddresses]);

  // If we have a pre-fill address from the estimator, drop it in once when delivery is chosen
  useEffect(() => {
    if (
      fulfillment === "delivery" &&
      prefillAddress &&
      !hasPrefilled.current &&
      !watch("deliveryAddress")
    ) {
      setValue("deliveryAddress", prefillAddress);
      hasPrefilled.current = true;
    }
  }, [fulfillment, prefillAddress, setValue, watch]);

  const handleAddressSelect = useCallback(
    (addressId: string) => {
      setSelectedAddressId(addressId);
      if (addressId === "manual") {
        setValue("deliveryAddress", "");
        deliveryAddressRef.current?.focus();
        return;
      }
      const address = savedAddresses.find((a) => a.id === addressId);
      if (address) {
        const formatted = `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
        setValue("deliveryAddress", formatted);
      }
    },
    [savedAddresses, setValue],
  );

  return (
    <div className="space-y-4 px-5 pt-5 pb-5">
      <h3 className="font-semibold">Pickup or Delivery</h3>

      <div className="grid grid-cols-2 gap-3">
        <FulfillmentOption
          icon={<MapPin className="h-5 w-5" />}
          title="Pickup"
          description="At our yard"
          selected={fulfillment === "pickup"}
          register={register}
          value="pickup"
        />
        <FulfillmentOption
          icon={<Truck className="h-5 w-5" />}
          title="Delivery"
          description="To your project site"
          selected={fulfillment === "delivery"}
          register={register}
          value="delivery"
        />
      </div>

      {fulfillment === "pickup" && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm animate-in fade-in slide-in-from-top-1 duration-300">
          <p className="font-medium text-foreground">Pickup Location</p>
          <p className="text-muted-foreground">
            {BUSINESS_INFO.address}, {BUSINESS_INFO.city},{" "}
            {BUSINESS_INFO.state} {BUSINESS_INFO.zip}
          </p>
          <p className="text-muted-foreground">Hours: {BUSINESS_INFO.hours}</p>
        </div>
      )}

      {fulfillment === "delivery" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
          {isLoaded && user && savedAddresses.length > 0 && (
            <div>
              <label
                htmlFor="fulfillment-saved-address"
                className="text-sm font-medium mb-1 block"
              >
                Saved Addresses
              </label>
              <Select
                value={selectedAddressId}
                onValueChange={handleAddressSelect}
              >
                <SelectTrigger id="fulfillment-saved-address">
                  <SelectValue placeholder="Select a saved address or enter manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Enter address manually</SelectItem>
                  {savedAddresses.map((addr) => (
                    <SelectItem key={addr.id} value={addr.id}>
                      {addr.label} — {addr.street}, {addr.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label
              htmlFor="fulfillment-delivery-address"
              className="text-sm font-medium mb-1 block"
            >
              Delivery Address *
            </label>
            <Textarea
              id="fulfillment-delivery-address"
              placeholder="Street address, city, state, zip"
              autoComplete="street-address"
              {...register("deliveryAddress")}
              ref={(e) => {
                register("deliveryAddress").ref(e);
                deliveryAddressRef.current = e;
              }}
            />
            {errors.deliveryAddress && (
              <p className="text-xs text-destructive mt-1">
                {errors.deliveryAddress.message}
              </p>
            )}
            {prefillAddress && (
              <p className="text-xs text-muted-foreground mt-1">
                Pre-filled from your project address — feel free to edit.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="fulfillment-delivery-notes"
              className="text-sm font-medium mb-1 block"
            >
              Delivery Notes
            </label>
            <Textarea
              id="fulfillment-delivery-notes"
              placeholder="Gate code, site instructions, where to dump, etc."
              rows={2}
              {...register("deliveryNotes")}
            />
          </div>

          <DeliveryAccessChecklist
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
          />

          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
            <p className="font-semibold text-sm">Delivery Notice &amp; Payment Terms</p>
            <p>
              By selecting delivery, you acknowledge that you are requesting materials to be
              delivered to the address and according to the instructions you provide.
            </p>
            <p>
              Please note that delivery fees are <strong>not included</strong> in your online
              payment and will not be charged at checkout. All product and service charges,
              excluding delivery fees, must be paid in full at the time the order is submitted
              to ensure your order can be processed and scheduled.
            </p>
            <p>
              After submitting your order, you will receive a payment confirmation and invoice
              for the materials purchased. Our staff will then review your order, schedule
              delivery, and prepare any required service agreements or confirmations. Please
              allow 24–48 business hours to receive your official service confirmation.
            </p>
            <p>
              <strong>Delivery charges will be assessed separately and collected by the driver
              at the time of delivery.</strong> Any estimated shipping or delivery amounts
              shown prior to checkout are for reference only and are not charged to your
              account during the ordering process.
            </p>
            <p>
              If the individual placing the order will not be present at the delivery location,
              please include the name and information of the authorized person responsible for
              receiving the materials, signing delivery documents, and making payment for
              delivery charges in the Delivery Instructions section above.
            </p>
            <p>
              Neither automated invoices, payment confirmations, digital receipts, nor delivery
              scheduling confirmations constitute payment of delivery fees unless explicitly
              stated otherwise.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface FulfillmentOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  register: UseFormRegister<CheckoutData>;
  value: "pickup" | "delivery";
}

function FulfillmentOption({
  icon,
  title,
  description,
  selected,
  register,
  value,
}: FulfillmentOptionProps) {
  const inputId = `fulfillment-${value}`;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-colors",
        selected
          ? "border-amber-500 bg-amber-50"
          : "border-border hover:border-amber-300",
      )}
    >
      <input
        id={inputId}
        type="radio"
        value={value}
        {...register("fulfillment")}
        className="sr-only"
      />
      <span
        className={cn(
          "transition-colors",
          selected ? "text-amber-600" : "text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}
