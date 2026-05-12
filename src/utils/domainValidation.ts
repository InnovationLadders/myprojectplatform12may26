import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface DomainSettings {
  enabled: boolean;
  allowedDomains: string[];
  messageAr?: string;
  messageEn?: string;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  allowedDomains?: string[];
}

/**
 * Extract domain from email address
 * @param email - Email address
 * @returns Domain part of the email (e.g., "@university.edu")
 */
export const extractDomain = (email: string): string => {
  if (!email || typeof email !== 'string') {
    return '';
  }

  const emailLower = email.toLowerCase().trim();
  const atIndex = emailLower.indexOf('@');

  if (atIndex === -1) {
    return '';
  }

  return emailLower.substring(atIndex);
};

/**
 * Normalize domain format
 * Accepts both "@domain.com" and "domain.com" and normalizes to "@domain.com"
 * @param domain - Domain string
 * @returns Normalized domain with @ prefix
 */
export const normalizeDomain = (domain: string): string => {
  if (!domain || typeof domain !== 'string') {
    return '';
  }

  const trimmed = domain.toLowerCase().trim();

  if (trimmed.startsWith('@')) {
    return trimmed;
  }

  return `@${trimmed}`;
};

/**
 * Validate domain format using regex
 * @param domain - Domain string
 * @returns True if valid domain format
 */
export const isValidDomainFormat = (domain: string): boolean => {
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  const normalized = normalizeDomain(domain);

  // Domain regex: @[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}
  const domainRegex = /^@[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;

  return domainRegex.test(normalized);
};

/**
 * Get domain validation settings for a school
 * @param schoolId - School document ID
 * @returns Domain settings object
 */
export const getSchoolDomainSettings = async (schoolId: string): Promise<DomainSettings> => {
  try {
    if (!schoolId) {
      return {
        enabled: false,
        allowedDomains: []
      };
    }

    console.log('🔍 [Domain Validation] Fetching settings for school:', schoolId);

    const schoolDoc = await getDoc(doc(db, 'users', schoolId));

    if (!schoolDoc.exists()) {
      console.warn('⚠️ [Domain Validation] School not found:', schoolId);
      return {
        enabled: false,
        allowedDomains: []
      };
    }

    const schoolData = schoolDoc.data();

    const settings: DomainSettings = {
      enabled: schoolData.domain_validation_enabled === true,
      allowedDomains: Array.isArray(schoolData.allowed_domains)
        ? schoolData.allowed_domains.map(normalizeDomain).filter(d => d !== '')
        : [],
      messageAr: schoolData.domain_validation_message_ar,
      messageEn: schoolData.domain_validation_message_en
    };

    console.log('✅ [Domain Validation] Settings retrieved:', {
      enabled: settings.enabled,
      domainsCount: settings.allowedDomains.length,
      domains: settings.allowedDomains
    });

    return settings;
  } catch (error) {
    console.error('❌ [Domain Validation] Error fetching settings:', error);
    return {
      enabled: false,
      allowedDomains: []
    };
  }
};

/**
 * Validate email domain against school's allowed domains
 * @param email - User's email address
 * @param schoolId - School document ID
 * @param language - Language for error message ('ar' or 'en')
 * @returns Validation result
 */
export const validateEmailDomain = async (
  email: string,
  schoolId: string,
  language: 'ar' | 'en' = 'ar'
): Promise<ValidationResult> => {
  try {
    console.log('🔍 [Domain Validation] Starting validation:', { email, schoolId, language });

    if (!email || !schoolId) {
      console.log('✅ [Domain Validation] Missing email or schoolId, skipping validation');
      return { isValid: true };
    }

    const settings = await getSchoolDomainSettings(schoolId);

    if (!settings.enabled) {
      console.log('✅ [Domain Validation] Validation disabled for this school');
      return { isValid: true };
    }

    if (!settings.allowedDomains || settings.allowedDomains.length === 0) {
      console.warn('⚠️ [Domain Validation] Validation enabled but no domains configured, allowing all');
      return { isValid: true };
    }

    const emailDomain = extractDomain(email);

    if (!emailDomain) {
      console.error('❌ [Domain Validation] Invalid email format');
      return {
        isValid: false,
        message: language === 'ar'
          ? 'صيغة البريد الإلكتروني غير صحيحة'
          : 'Invalid email format',
        allowedDomains: settings.allowedDomains
      };
    }

    const isAllowed = settings.allowedDomains.some(
      allowedDomain => emailDomain === allowedDomain
    );

    if (isAllowed) {
      console.log('✅ [Domain Validation] Email domain is valid:', emailDomain);
      return { isValid: true };
    }

    console.log('❌ [Domain Validation] Email domain not allowed:', {
      emailDomain,
      allowedDomains: settings.allowedDomains
    });

    const customMessage = language === 'ar' ? settings.messageAr : settings.messageEn;

    const defaultMessage = language === 'ar'
      ? `عذراً، هذه المؤسسة تتطلب التسجيل باستخدام البريد الإلكتروني الرسمي الخاص بها. النطاقات المقبولة: ${settings.allowedDomains.join('، ')}`
      : `Sorry, this institution requires registration using an official email address. Accepted domains: ${settings.allowedDomains.join(', ')}`;

    return {
      isValid: false,
      message: customMessage || defaultMessage,
      allowedDomains: settings.allowedDomains
    };
  } catch (error) {
    console.error('❌ [Domain Validation] Error during validation:', error);
    return { isValid: true };
  }
};

/**
 * Test if an email would be accepted by a school's domain validation
 * Used for preview/testing in admin panel
 * @param email - Email to test
 * @param allowedDomains - Array of allowed domains
 * @returns True if email would be accepted
 */
export const testEmailAgainstDomains = (email: string, allowedDomains: string[]): boolean => {
  if (!email || !allowedDomains || allowedDomains.length === 0) {
    return true;
  }

  const emailDomain = extractDomain(email);

  if (!emailDomain) {
    return false;
  }

  const normalizedDomains = allowedDomains.map(normalizeDomain);

  return normalizedDomains.some(domain => emailDomain === domain);
};
