/**
 * Delivery Scheduling Utility
 *
 * Provides functions for calculating available delivery slots, booking deliveries,
 * and managing capacity against configured business rules. This module enforces
 * lead time requirements, blackout dates, daily capacity limits, and business day
 * constraints.
 *
 * Core functions:
 * - getAvailableSlots: Find all bookable time windows in a date range
 * - isSlotAvailable: Check if a specific date/time can be booked
 * - bookSlot: Reserve a slot for an order (atomic with order creation)
 * - releaseSlot: Free up capacity when an order is canceled or rescheduled
 *
 * Capacity model:
 * - Each business day has N slots (e.g., "morning", "afternoon")
 * - Each slot can hold M orders (e.g., 5 trucks per morning)
 * - Slots are disabled when full, blacklisted, or within lead time
 *
 * @see DeliveryConfig model in prisma/schema.prisma
 * @see Order.deliveryDate, deliveryTimeWindow, scheduledSlotId
 */

import { prisma } from "@/lib/prisma";

/**
 * Delivery time window definition
 */
interface TimeWindow {
  key: string; // e.g., "morning", "afternoon", "allday"
  label: string; // e.g., "Morning (8am-12pm)"
  start: string; // e.g., "08:00"
  end: string; // e.g., "12:00"
}

/**
 * Available days configuration
 * Maps day names to boolean availability
 */
interface AvailableDays {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

/**
 * Delivery configuration from database
 */
interface DeliveryConfig {
  id: string;
  availableDays: AvailableDays;
  blackoutDates: string[]; // ISO date strings
  slotsPerDay: number;
  capacityPerSlot: number;
  leadTimeDays: number;
  timeWindows: TimeWindow[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Available slot result
 */
export interface AvailableSlot {
  date: string; // ISO date string (YYYY-MM-DD)
  dateDisplay: string; // Human-readable date
  windows: {
    key: string;
    label: string;
    available: number; // Remaining capacity
    total: number; // Total capacity
    disabled: boolean; // True if full or unavailable
  }[];
}

/**
 * Slot booking identifier
 */
interface SlotIdentifier {
  date: Date;
  window: string;
}

/**
 * Gets the singleton delivery configuration from the database.
 * Creates default config if none exists.
 *
 * @returns The active delivery configuration
 * @throws Error if database access fails
 */
async function getDeliveryConfig(): Promise<DeliveryConfig> {
  // Check for existing config
  const existing = await prisma.deliveryConfig.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return {
      id: existing.id,
      availableDays: existing.availableDays as unknown as AvailableDays,
      blackoutDates: existing.blackoutDates as unknown as string[],
      slotsPerDay: existing.slotsPerDay,
      capacityPerSlot: existing.capacityPerSlot,
      leadTimeDays: existing.leadTimeDays,
      timeWindows: existing.timeWindows as unknown as TimeWindow[],
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
    };
  }

  // Create default config if none exists
  const defaultConfig = await prisma.deliveryConfig.create({
    data: {
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
          label: "Afternoon (1pm-4pm)",
          start: "13:00",
          end: "16:00",
        },
      ],
    },
  });

  return {
    id: defaultConfig.id,
    availableDays: defaultConfig.availableDays as unknown as AvailableDays,
    blackoutDates: defaultConfig.blackoutDates as unknown as string[],
    slotsPerDay: defaultConfig.slotsPerDay,
    capacityPerSlot: defaultConfig.capacityPerSlot,
    leadTimeDays: defaultConfig.leadTimeDays,
    timeWindows: defaultConfig.timeWindows as unknown as TimeWindow[],
    createdAt: defaultConfig.createdAt,
    updatedAt: defaultConfig.updatedAt,
  };
}

/**
 * Converts a Date to YYYY-MM-DD format
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Gets the day name from a Date (e.g., "monday", "tuesday")
 */
function getDayName(date: Date): keyof AvailableDays {
  const days: (keyof AvailableDays)[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[date.getDay()];
}

/**
 * Formats a date for human-readable display
 */
function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Checks if a date is a blackout date
 */
function isBlackoutDate(date: Date, blackoutDates: string[]): boolean {
  const dateStr = formatDate(date);
  return blackoutDates.includes(dateStr);
}

/**
 * Checks if a date is within the lead time window
 */
function isWithinLeadTime(date: Date, leadTimeDays: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysDiff < leadTimeDays;
}

/**
 * Counts how many orders are already booked for a specific date and time window
 */
async function getBookedCount(date: Date, window: string): Promise<number> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await prisma.order.count({
    where: {
      deliveryDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      deliveryTimeWindow: window,
      // Only count orders that aren't canceled
      status: {
        not: "canceled",
      },
    },
  });

  return count;
}

/**
 * Gets all available delivery slots within a date range.
 *
 * This function calculates which delivery dates and time windows are bookable,
 * respecting business rules:
 * - Only includes configured business days (e.g., Mon-Fri)
 * - Excludes blackout dates (holidays, scheduled closures)
 * - Enforces lead time (e.g., 2 days minimum notice)
 * - Shows remaining capacity per slot
 *
 * Use case: Customer checkout flow - display calendar of available delivery dates
 *
 * @param startDate - Start of date range (defaults to today)
 * @param endDate - End of date range (defaults to 30 days from start)
 * @returns Array of available slots with capacity information
 * @throws Error if database access fails
 *
 * @example
 * ```ts
 * const slots = await getAvailableSlots(
 *   new Date('2026-06-25'),
 *   new Date('2026-07-25')
 * );
 * // Returns: [
 * //   {
 * //     date: '2026-06-27',
 * //     dateDisplay: 'Fri, Jun 27',
 * //     windows: [
 * //       { key: 'morning', label: 'Morning (8am-12pm)', available: 3, total: 5, disabled: false },
 * //       { key: 'afternoon', label: 'Afternoon (1pm-4pm)', available: 5, total: 5, disabled: false }
 * //     ]
 * //   },
 * //   ...
 * // ]
 * ```
 */
export async function getAvailableSlots(
  startDate?: Date,
  endDate?: Date
): Promise<AvailableSlot[]> {
  const config = await getDeliveryConfig();

  // Default to today and 30 days out
  const start = startDate || new Date();
  const end =
    endDate || new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

  const availableSlots: AvailableSlot[] = [];

  // Iterate through each day in the range
  const currentDate = new Date(start);
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate <= end) {
    // Check if this day is configured as available
    const dayName = getDayName(currentDate);
    const isDayAvailable = config.availableDays[dayName];

    // Check if this day is a blackout date
    const isBlackedOut = isBlackoutDate(currentDate, config.blackoutDates);

    // Check if this day is within lead time
    const isTooSoon = isWithinLeadTime(currentDate, config.leadTimeDays);

    // Only include days that pass all checks
    if (isDayAvailable && !isBlackedOut && !isTooSoon) {
      const windows = [];

      // Check capacity for each time window
      for (const window of config.timeWindows) {
        const bookedCount = await getBookedCount(currentDate, window.key);
        const availableCount = config.capacityPerSlot - bookedCount;

        windows.push({
          key: window.key,
          label: window.label,
          available: Math.max(0, availableCount),
          total: config.capacityPerSlot,
          disabled: availableCount <= 0,
        });
      }

      availableSlots.push({
        date: formatDate(currentDate),
        dateDisplay: formatDateDisplay(currentDate),
        windows,
      });
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availableSlots;
}

/**
 * Checks if a specific delivery slot is available for booking.
 *
 * This is the atomic availability check used before booking a slot.
 * It verifies:
 * - The date is a configured business day
 * - The date is not a blackout date
 * - The date is outside the lead time window
 * - The time window exists in config
 * - The slot has available capacity
 *
 * Use case: Final validation before order creation, API endpoint validation
 *
 * @param date - The delivery date to check
 * @param window - The time window key (e.g., "morning", "afternoon")
 * @returns True if the slot can be booked, false otherwise
 * @throws Error if database access fails
 *
 * @example
 * ```ts
 * const canBook = await isSlotAvailable(
 *   new Date('2026-06-27'),
 *   'morning'
 * );
 * if (!canBook) {
 *   throw new Error('Selected delivery slot is no longer available');
 * }
 * ```
 */
export async function isSlotAvailable(
  date: Date,
  window: string
): Promise<boolean> {
  const config = await getDeliveryConfig();

  // Check if day is configured as available
  const dayName = getDayName(date);
  if (!config.availableDays[dayName]) {
    return false;
  }

  // Check if date is blacklisted
  if (isBlackoutDate(date, config.blackoutDates)) {
    return false;
  }

  // Check if date is within lead time
  if (isWithinLeadTime(date, config.leadTimeDays)) {
    return false;
  }

  // Check if window exists in config
  const windowExists = config.timeWindows.some((w) => w.key === window);
  if (!windowExists) {
    return false;
  }

  // Check capacity
  const bookedCount = await getBookedCount(date, window);
  const availableCount = config.capacityPerSlot - bookedCount;

  return availableCount > 0;
}

/**
 * Books a delivery slot for an order.
 *
 * This function should be called atomically with order creation to reserve
 * capacity. It generates a unique slot ID that can be used to track and
 * release the booking later.
 *
 * IMPORTANT: This does NOT create or update the Order record - that's the
 * caller's responsibility. This function only validates availability and
 * generates a slot ID. The actual booking happens when the Order is created
 * with deliveryDate, deliveryTimeWindow, and scheduledSlotId populated.
 *
 * Race condition handling:
 * - The final capacity check happens at Order creation time (database constraint)
 * - If two requests try to book the last slot simultaneously, one will succeed
 *   and the other should get a validation error
 *
 * @param orderId - The order ID that will be created
 * @param date - The delivery date
 * @param window - The time window key
 * @returns The slot ID to be stored on the Order
 * @throws Error if slot is not available or validation fails
 *
 * @example
 * ```ts
 * // In checkout API route:
 * const slotId = await bookSlot(orderId, deliveryDate, deliveryWindow);
 *
 * // Then create the order with these fields populated:
 * await prisma.order.create({
 *   data: {
 *     // ... other order fields
 *     deliveryDate: deliveryDate,
 *     deliveryTimeWindow: deliveryWindow,
 *     scheduledSlotId: slotId,
 *   }
 * });
 * ```
 */
export async function bookSlot(
  orderId: string,
  date: Date,
  window: string
): Promise<string> {
  // Validate slot is available
  const available = await isSlotAvailable(date, window);
  if (!available) {
    throw new Error(
      `Delivery slot ${formatDate(date)} ${window} is not available`
    );
  }

  // Generate unique slot ID
  // Format: YYYY-MM-DD-window-orderId
  const slotId = `${formatDate(date)}-${window}-${orderId}`;

  return slotId;
}

/**
 * Releases a delivery slot when an order is canceled or rescheduled.
 *
 * This function should be called when:
 * - An order is canceled (frees up capacity permanently)
 * - An order is rescheduled (call this before booking new slot)
 * - An order status changes to a terminal state that frees capacity
 *
 * The function finds the order and clears its delivery scheduling fields,
 * which automatically frees up the capacity for that date/window.
 *
 * @param orderId - The order ID to release
 * @returns True if a slot was released, false if order had no scheduled slot
 * @throws Error if order not found or database access fails
 *
 * @example
 * ```ts
 * // When rescheduling an order:
 * await releaseSlot(orderId); // Free old slot
 * const newSlotId = await bookSlot(orderId, newDate, newWindow); // Book new slot
 * await prisma.order.update({
 *   where: { id: orderId },
 *   data: {
 *     deliveryDate: newDate,
 *     deliveryTimeWindow: newWindow,
 *     scheduledSlotId: newSlotId,
 *   }
 * });
 * ```
 */
export async function releaseSlot(orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      deliveryDate: true,
      deliveryTimeWindow: true,
      scheduledSlotId: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // If order has no scheduled slot, nothing to release
  if (!order.deliveryDate || !order.deliveryTimeWindow) {
    return false;
  }

  // Clear delivery scheduling fields to release capacity
  await prisma.order.update({
    where: { id: orderId },
    data: {
      deliveryDate: null,
      deliveryTimeWindow: null,
      scheduledSlotId: null,
    },
  });

  return true;
}

/**
 * Gets the configured time windows.
 *
 * Utility function for displaying available time window options in UI.
 *
 * @returns Array of configured time windows
 * @throws Error if database access fails
 *
 * @example
 * ```ts
 * const windows = await getTimeWindows();
 * // Returns: [
 * //   { key: 'morning', label: 'Morning (8am-12pm)', start: '08:00', end: '12:00' },
 * //   { key: 'afternoon', label: 'Afternoon (1pm-4pm)', start: '13:00', end: '16:00' }
 * // ]
 * ```
 */
export async function getTimeWindows(): Promise<TimeWindow[]> {
  const config = await getDeliveryConfig();
  return config.timeWindows;
}

/**
 * Gets the configured lead time in days.
 *
 * Utility function for displaying lead time requirements to customers.
 *
 * @returns Number of days lead time required
 * @throws Error if database access fails
 *
 * @example
 * ```ts
 * const leadTime = await getLeadTimeDays();
 * // Display to user: "Delivery requires ${leadTime} business days notice"
 * ```
 */
export async function getLeadTimeDays(): Promise<number> {
  const config = await getDeliveryConfig();
  return config.leadTimeDays;
}
