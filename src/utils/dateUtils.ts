import { Timestamp } from 'firebase/firestore';

/**
 * Utility functions for date formatting and manipulation
 * All functions use Gregorian calendar for Arabic locale
 */

/**
 * Convert various date inputs to a JavaScript Date object
 * @param dateInput - Date string, Date object, or Firestore Timestamp
 * @returns JavaScript Date object or null if invalid
 */
export const toDateObject = (dateInput: string | Date | Timestamp | null | undefined): Date | null => {
  if (!dateInput) return null;
  
  try {
    // Handle Firestore Timestamp
    if (dateInput instanceof Timestamp) {
      return dateInput.toDate();
    }
    
    // Handle Date object
    if (dateInput instanceof Date) {
      return dateInput;
    }
    
    // Handle string
    if (typeof dateInput === 'string') {
      // Check if it's a timestamp number
      if (!isNaN(Number(dateInput))) {
        return new Date(Number(dateInput));
      }
      // Try to parse as ISO date
      const parsedDate = new Date(dateInput);
      if (isNaN(parsedDate.getTime())) {
        return null;
      }
      return parsedDate;
    }
    
    return null;
  } catch (error) {
    console.error("Error converting to Date object:", error);
    return null;
  }
};

/**
 * Format a date string to a localized date string (Gregorian calendar)
 * @param dateString - ISO date string, Date object, or Firestore Timestamp
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (dateString: string | Date | Timestamp | null | undefined, options?: Intl.DateTimeFormatOptions): string => {
  const date = toDateObject(dateString);
  if (!date) return 'غير محدد';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory' // Ensure Gregorian calendar is used
  };
  
  return date.toLocaleDateString('ar-SA', { ...defaultOptions, ...options });
};

/**
 * Format a date string to a localized date and time string (Gregorian calendar)
 * @param dateString - ISO date string, Date object, or Firestore Timestamp
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date and time string
 */
export const formatDateTime = (dateString: string | Date | Timestamp | null | undefined, options?: Intl.DateTimeFormatOptions): string => {
  const date = toDateObject(dateString);
  if (!date) return 'غير محدد';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    calendar: 'gregory' // Ensure Gregorian calendar is used
  };
  
  return date.toLocaleString('ar-SA', { ...defaultOptions, ...options });
};

/**
 * Calculate days remaining until a date
 * @param dueDate - ISO date string, Date object, or Firestore Timestamp
 * @returns Number of days remaining (negative if past due)
 */
export const getDaysRemaining = (dueDate: string | Date | Timestamp | null | undefined): number | null => {
  const dueDateTime = toDateObject(dueDate);
  if (!dueDateTime) return null;
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    // Reset time part of due date to ensure accurate day calculation
    const dueDateOnly = new Date(dueDateTime);
    dueDateOnly.setHours(0, 0, 0, 0);
    
    const diffTime = dueDateOnly.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error("Error calculating days remaining:", error);
    return null;
  }
};

/**
 * Format a time string (Gregorian calendar)
 * @param dateString - ISO date string, Date object, or Firestore Timestamp
 * @returns Formatted time string
 */
export const formatTime = (dateString: string | Date | Timestamp | null | undefined): string => {
  const date = toDateObject(dateString);
  if (!date) return '';
  
  return date.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    calendar: 'gregory' // Ensure Gregorian calendar is used
  });
};

/**
 * Format a relative time (e.g., "2 days ago", "just now")
 * @param dateString - ISO date string, Date object, or Firestore Timestamp
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (dateString: string | Date | Timestamp | null | undefined): string => {
  const date = toDateObject(dateString);
  if (!date) return '';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'الآن';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `منذ ${diffInMinutes} دقيقة`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `منذ ${diffInHours} ساعة`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `منذ ${diffInDays} يوم`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `منذ ${diffInMonths} شهر`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `منذ ${diffInYears} سنة`;
};