import { Timestamp } from 'firebase/firestore';
import i18n from '../i18n';

const getLocale = (): string => {
  return i18n.language?.startsWith('en') ? 'en-US' : 'ar-SA';
};

const getNotSpecified = (): string => {
  return i18n.language?.startsWith('en') ? 'Not specified' : 'غير محدد';
};

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
  if (!date) return getNotSpecified();
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory' // Ensure Gregorian calendar is used
  };
  
  return date.toLocaleDateString(getLocale(), { ...defaultOptions, ...options });
};

/**
 * Format a date string to a localized date and time string (Gregorian calendar)
 * @param dateString - ISO date string, Date object, or Firestore Timestamp
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date and time string
 */
export const formatDateTime = (dateString: string | Date | Timestamp | null | undefined, options?: Intl.DateTimeFormatOptions): string => {
  const date = toDateObject(dateString);
  if (!date) return getNotSpecified();
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    calendar: 'gregory' // Ensure Gregorian calendar is used
  };
  
  return date.toLocaleString(getLocale(), { ...defaultOptions, ...options });
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
  
  return date.toLocaleTimeString(getLocale(), {
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
  if (!date) return i18n.language?.startsWith('en') ? 'Not available' : 'غير متوفر';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const isEnglish = i18n.language?.startsWith('en');

  if (diffInSeconds < 60) {
    return isEnglish ? 'Just now' : 'الآن';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return isEnglish ? `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago` : `منذ ${diffInMinutes} دقيقة`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return isEnglish ? `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago` : `منذ ${diffInHours} ساعة`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return isEnglish ? `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago` : `منذ ${diffInDays} يوم`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return isEnglish ? `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago` : `منذ ${diffInMonths} شهر`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return isEnglish ? `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago` : `منذ ${diffInYears} سنة`;
};