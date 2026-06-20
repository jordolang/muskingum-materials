/**
 * Business hours utility for detecting after-hours periods and adjusting messaging
 * Based on Muskingum Materials' operating hours: Monday-Friday 7:30 AM – 4:00 PM ET
 */

/**
 * Business hours configuration
 * Hours are in 24-hour format for the America/New_York timezone
 */
const BUSINESS_HOURS = {
  timezone: 'America/New_York',
  startHour: 7,
  startMinute: 30,
  endHour: 16, // 4:00 PM
  endMinute: 0,
  // Days of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  openDays: [1, 2, 3, 4, 5] as number[], // Monday through Friday
};

/**
 * Gets the current date/time in the business timezone
 * @param date - Optional date to convert (defaults to now)
 * @returns Date object in business timezone
 */
function getBusinessTimezoneDate(date?: Date): Date {
  const targetDate = date || new Date();

  // Convert to business timezone using toLocaleString
  const tzString = targetDate.toLocaleString('en-US', {
    timeZone: BUSINESS_HOURS.timezone,
  });

  return new Date(tzString);
}

/**
 * Checks if the given date/time falls within business hours
 * @param date - Optional date to check (defaults to current time)
 * @returns true if within business hours, false otherwise
 */
export function isBusinessHours(date?: Date): boolean {
  const businessDate = getBusinessTimezoneDate(date);

  const dayOfWeek = businessDate.getDay();
  const hour = businessDate.getHours();
  const minute = businessDate.getMinutes();

  // Check if it's a business day (Monday-Friday)
  if (!BUSINESS_HOURS.openDays.includes(dayOfWeek)) {
    return false;
  }

  // Convert times to minutes since midnight for easier comparison
  const currentMinutes = hour * 60 + minute;
  const startMinutes = BUSINESS_HOURS.startHour * 60 + BUSINESS_HOURS.startMinute;
  const endMinutes = BUSINESS_HOURS.endHour * 60 + BUSINESS_HOURS.endMinute;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Gets the next business day from the given date
 * @param date - Optional starting date (defaults to current time)
 * @returns Date object representing the start of the next business day
 */
export function getNextBusinessDay(date?: Date): Date {
  const businessDate = getBusinessTimezoneDate(date);
  const nextDay = new Date(businessDate);

  // Keep adding days until we hit a business day
  do {
    nextDay.setDate(nextDay.getDate() + 1);
  } while (!BUSINESS_HOURS.openDays.includes(nextDay.getDay()));

  // Set to business opening time
  nextDay.setHours(BUSINESS_HOURS.startHour, BUSINESS_HOURS.startMinute, 0, 0);

  return nextDay;
}

/**
 * Gets a human-readable message indicating when the business will be available
 * @param date - Optional date to check (defaults to current time)
 * @returns Message string like "tomorrow morning" or "Monday morning"
 */
export function getNextAvailableMessage(date?: Date): string {
  if (isBusinessHours(date)) {
    return 'shortly';
  }

  const businessDate = getBusinessTimezoneDate(date);
  const nextBusinessDay = getNextBusinessDay(date);

  const currentDay = businessDate.getDay();
  const nextDay = nextBusinessDay.getDay();

  // If next business day is tomorrow
  if (nextBusinessDay.getDate() === businessDate.getDate() + 1) {
    return 'tomorrow morning';
  }

  // If it's Friday after hours or weekend
  if (currentDay === 5 || currentDay === 6 || currentDay === 0) {
    return 'Monday morning';
  }

  // Otherwise, return the day name
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${dayNames[nextDay]} morning`;
}

/**
 * Checks if the current time is after business hours (but on a business day)
 * vs a weekend/holiday
 * @param date - Optional date to check (defaults to current time)
 * @returns Object with isAfterHours and isWeekend flags
 */
export function getBusinessHoursStatus(date?: Date): {
  isBusinessHours: boolean;
  isAfterHours: boolean;
  isWeekend: boolean;
  nextAvailable: string;
} {
  const businessDate = getBusinessTimezoneDate(date);
  const dayOfWeek = businessDate.getDay();
  const isWeekend = !BUSINESS_HOURS.openDays.includes(dayOfWeek);
  const inBusinessHours = isBusinessHours(date);

  return {
    isBusinessHours: inBusinessHours,
    isAfterHours: !inBusinessHours && !isWeekend,
    isWeekend,
    nextAvailable: getNextAvailableMessage(date),
  };
}
