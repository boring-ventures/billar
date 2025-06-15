import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a duration in milliseconds to a human-readable string
 * @param ms Duration in milliseconds
 * @returns Formatted string like "2h 30m" or "45m 20s"
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format a number or string as currency
 * @param value The amount to format (number or string)
 * @param currency The currency code (default: BOB)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | string,
  currency = "BOB"
): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("es-BO", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-BO").format(value);
}

export function formatDate(date: Date | string) {
  if (!date) return "";

  const d = new Date(date);
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

// Date utilities for better timezone handling
export function getStartOfDay(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export function getEndOfDay(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function getStartOfMonth(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function getEndOfMonth(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function isToday(date: Date | string): boolean {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

// Format date for display in local timezone
export function formatDateLocal(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";

  const d = new Date(date);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  return new Intl.DateTimeFormat("es-BO", {
    ...defaultOptions,
    ...options,
  }).format(d);
}

// Business hours utilities
export interface BusinessHours {
  start: string; // "HH:MM" format
  end: string; // "HH:MM" format
  timezone?: string;
  operatingDays?: string[]; // ["MON", "TUE", "WED", ...]
}

export interface IndividualDayHours {
  [key: string]: {
    start: string;
    end: string;
    enabled: boolean;
  };
}

export interface CompanyBusinessHours {
  useIndividualHours?: boolean;
  generalHours?: BusinessHours;
  individualHours?: IndividualDayHours;
}

/**
 * Get business day start time for a given date
 * @param date The date to get business hours for
 * @param businessConfig Business hours configuration (general or individual)
 * @returns Date object representing business day start
 */
export function getBusinessDayStart(
  date: Date,
  businessConfig?: CompanyBusinessHours
): Date {
  if (!businessConfig) {
    return getStartOfDay(date);
  }

  if (businessConfig.useIndividualHours && businessConfig.individualHours) {
    const dayOfWeek = date
      .toLocaleDateString("en-US", { weekday: "short" })
      .toUpperCase();
    const dayConfig = businessConfig.individualHours[dayOfWeek];

    if (!dayConfig || !dayConfig.enabled) {
      return getStartOfDay(date);
    }

    const [hours, minutes] = dayConfig.start.split(":").map(Number);
    const businessStart = new Date(date);
    businessStart.setHours(hours, minutes, 0, 0);
    return businessStart;
  }

  // Fallback to general hours
  if (!businessConfig.generalHours?.start) {
    return getStartOfDay(date);
  }

  const [hours, minutes] = businessConfig.generalHours.start
    .split(":")
    .map(Number);
  const businessStart = new Date(date);
  businessStart.setHours(hours, minutes, 0, 0);

  return businessStart;
}

/**
 * Get business day end time for a given date
 * @param date The date to get business hours for
 * @param businessConfig Business hours configuration (general or individual)
 * @returns Date object representing business day end
 */
export function getBusinessDayEnd(
  date: Date,
  businessConfig?: CompanyBusinessHours
): Date {
  if (!businessConfig) {
    return getEndOfDay(date);
  }

  if (businessConfig.useIndividualHours && businessConfig.individualHours) {
    const dayOfWeek = date
      .toLocaleDateString("en-US", { weekday: "short" })
      .toUpperCase();
    const dayConfig = businessConfig.individualHours[dayOfWeek];

    if (!dayConfig || !dayConfig.enabled) {
      return getEndOfDay(date);
    }

    const [hours, minutes] = dayConfig.end.split(":").map(Number);
    const businessEnd = new Date(date);
    businessEnd.setHours(hours, minutes, 59, 999);

    // Handle business that closes after midnight (next day)
    if (dayConfig.start && dayConfig.end < dayConfig.start) {
      businessEnd.setDate(businessEnd.getDate() + 1);
    }

    return businessEnd;
  }

  // Fallback to general hours
  if (!businessConfig.generalHours?.end) {
    return getEndOfDay(date);
  }

  const [hours, minutes] = businessConfig.generalHours.end
    .split(":")
    .map(Number);
  const businessEnd = new Date(date);
  businessEnd.setHours(hours, minutes, 59, 999);

  // Handle business that closes after midnight (next day)
  if (
    businessConfig.generalHours.start &&
    businessConfig.generalHours.end < businessConfig.generalHours.start
  ) {
    businessEnd.setDate(businessEnd.getDate() + 1);
  }

  return businessEnd;
}

/**
 * Check if a date falls within business hours
 * @param date Date to check
 * @param businessConfig Business hours configuration
 * @returns boolean indicating if date is within business hours
 */
export function isWithinBusinessHours(
  date: Date,
  businessConfig?: CompanyBusinessHours
): boolean {
  if (!businessConfig) {
    return true; // No business hours set, consider all times valid
  }

  const dayOfWeek = date
    .toLocaleDateString("en-US", { weekday: "short" })
    .toUpperCase();

  if (businessConfig.useIndividualHours && businessConfig.individualHours) {
    const dayConfig = businessConfig.individualHours[dayOfWeek];
    if (!dayConfig || !dayConfig.enabled) {
      return false;
    }
  } else if (businessConfig.generalHours) {
    // Check if current day is an operating day for general hours
    if (
      businessConfig.generalHours.operatingDays &&
      businessConfig.generalHours.operatingDays.length > 0
    ) {
      if (!businessConfig.generalHours.operatingDays.includes(dayOfWeek)) {
        return false;
      }
    }
  }

  const businessStart = getBusinessDayStart(date, businessConfig);
  const businessEnd = getBusinessDayEnd(date, businessConfig);

  return date >= businessStart && date <= businessEnd;
}

/**
 * Get the current business day boundaries (start and end)
 * @param businessConfig Business hours configuration
 * @returns Object with start and end dates for current business day
 */
export function getCurrentBusinessDay(businessConfig?: CompanyBusinessHours): {
  start: Date;
  end: Date;
} {
  const today = new Date();

  return {
    start: getBusinessDayStart(today, businessConfig),
    end: getBusinessDayEnd(today, businessConfig),
  };
}

/**
 * Format time in HH:MM format
 * @param time Time string or Date
 * @returns Formatted time string
 */
export function formatTime(time: string | Date): string {
  if (typeof time === "string") {
    return time;
  }

  return time.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Parse operating days from JSON string
 * @param operatingDaysJson JSON string of operating days
 * @returns Array of day abbreviations
 */
export function parseOperatingDays(operatingDaysJson?: string): string[] {
  if (!operatingDaysJson) {
    return ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]; // Default to all days
  }

  try {
    return JSON.parse(operatingDaysJson);
  } catch {
    return ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  }
}

/**
 * Convert operating days array to JSON string
 * @param days Array of day abbreviations
 * @returns JSON string
 */
export function stringifyOperatingDays(days: string[]): string {
  return JSON.stringify(days);
}

/**
 * Parse individual day hours from JSON string
 * @param individualDayHoursJson JSON string of individual day hours
 * @returns IndividualDayHours object
 */
export function parseIndividualDayHours(
  individualDayHoursJson?: string
): IndividualDayHours {
  if (!individualDayHoursJson) {
    return {};
  }

  try {
    return JSON.parse(individualDayHoursJson);
  } catch {
    return {};
  }
}

/**
 * Convert individual day hours object to JSON string
 * @param individualHours IndividualDayHours object
 * @returns JSON string
 */
export function stringifyIndividualDayHours(
  individualHours: IndividualDayHours
): string {
  return JSON.stringify(individualHours);
}

/**
 * Create default individual day hours from general hours
 * @param generalStart General opening time
 * @param generalEnd General closing time
 * @param operatingDays Array of operating days
 * @returns IndividualDayHours object
 */
export function createDefaultIndividualHours(
  generalStart?: string,
  generalEnd?: string,
  operatingDays?: string[]
): IndividualDayHours {
  // Ensure we have valid time values, fallback to defaults
  const defaultStart =
    generalStart && generalStart.trim() !== "" ? generalStart : "08:00";
  const defaultEnd =
    generalEnd && generalEnd.trim() !== "" ? generalEnd : "18:00";

  // Ensure we have valid operating days
  const defaultOperatingDays =
    operatingDays && operatingDays.length > 0
      ? operatingDays
      : ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  console.log("createDefaultIndividualHours inputs:", {
    generalStart,
    generalEnd,
    operatingDays,
    defaultStart,
    defaultEnd,
    defaultOperatingDays,
  });

  const individualHours: IndividualDayHours = {};

  const allDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  allDays.forEach((day) => {
    individualHours[day] = {
      start: defaultStart,
      end: defaultEnd,
      enabled: defaultOperatingDays.includes(day),
    };
  });

  console.log("createDefaultIndividualHours result:", individualHours);
  return individualHours;
}

// Legacy function for backward compatibility
export function getBusinessDayStartLegacy(
  date: Date,
  businessHours?: BusinessHours
): Date {
  if (!businessHours?.start) {
    return getStartOfDay(date);
  }

  const [hours, minutes] = businessHours.start.split(":").map(Number);
  const businessStart = new Date(date);
  businessStart.setHours(hours, minutes, 0, 0);

  return businessStart;
}

// Legacy function for backward compatibility
export function getBusinessDayEndLegacy(
  date: Date,
  businessHours?: BusinessHours
): Date {
  if (!businessHours?.end) {
    return getEndOfDay(date);
  }

  const [hours, minutes] = businessHours.end.split(":").map(Number);
  const businessEnd = new Date(date);
  businessEnd.setHours(hours, minutes, 59, 999);

  // Handle business that closes after midnight (next day)
  if (businessHours.start && businessHours.end < businessHours.start) {
    businessEnd.setDate(businessEnd.getDate() + 1);
  }

  return businessEnd;
}
