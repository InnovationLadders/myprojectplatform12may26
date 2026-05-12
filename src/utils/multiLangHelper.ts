import { MultiLangText, MultiLangArray } from '../hooks/useProjectIdeas';
import i18n from '../i18n';

/**
 * Helper functions to safely extract text from fields that can be either
 * plain strings/arrays (old format) or MultiLang objects (new format)
 *
 * This provides backward compatibility during the migration period
 */

/**
 * Extracts text from a field that can be string or MultiLangText
 */
export const getTextValue = (field: string | MultiLangText | undefined, language?: string): string => {
  if (!field) return '';

  const currentLang = language || i18n.language || 'ar';

  // If it's a plain string (old format), return it directly
  if (typeof field === 'string') {
    return field;
  }

  // If it's a MultiLangText object (new format), return the appropriate language
  if (typeof field === 'object' && (field.ar || field.en)) {
    return field[currentLang as 'ar' | 'en'] || field.ar || field.en || '';
  }

  return '';
};

/**
 * Extracts array from a field that can be string[] or MultiLangArray
 */
export const getArrayValue = (field: string[] | MultiLangArray | undefined, language?: string): string[] => {
  if (!field) return [];

  const currentLang = language || i18n.language || 'ar';

  // If it's a plain array (old format), return it directly
  if (Array.isArray(field)) {
    return field;
  }

  // If it's a MultiLangArray object (new format), return the appropriate language array
  if (typeof field === 'object' && (field.ar || field.en)) {
    return field[currentLang as 'ar' | 'en'] || field.ar || field.en || [];
  }

  return [];
};

/**
 * Checks if a text field matches a search term (supports both formats)
 */
export const matchesSearchTerm = (
  field: string | MultiLangText | undefined,
  searchTerm: string,
  language?: string
): boolean => {
  const value = getTextValue(field, language);
  return value.toLowerCase().includes(searchTerm.toLowerCase());
};

/**
 * Checks if an array field contains a search term (supports both formats)
 */
export const arrayContainsSearchTerm = (
  field: string[] | MultiLangArray | undefined,
  searchTerm: string,
  language?: string
): boolean => {
  const values = getArrayValue(field, language);
  return values.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
};
