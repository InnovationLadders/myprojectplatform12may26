/**
 * Subdomain utilities for multi-tenancy support
 * Allows each educational institution to have their own subdomain
 */

const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'admin',
  'app',
  'dashboard',
  'portal',
  'auth',
  'login',
  'register',
  'static',
  'cdn',
  'assets',
  'images',
  'files',
  'mail',
  'smtp',
  'ftp',
  'blog',
  'help',
  'support',
  'docs',
  'dev',
  'staging',
  'test'
];

/**
 * Extracts the subdomain from the current URL
 * @returns The subdomain string or null if not found
 * @example
 * // URL: https://school1.example.com
 * // Returns: "school1"
 */
export const getSubdomain = (): string | null => {
  try {
    const hostname = window.location.hostname;

    // Skip localhost and IP addresses
    if (hostname === 'localhost' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return null;
    }

    const parts = hostname.split('.');

    // We need at least 3 parts for a subdomain (subdomain.domain.tld)
    if (parts.length < 3) {
      return null;
    }

    const subdomain = parts[0];

    // Check if it's a reserved subdomain
    if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
      return null;
    }

    // Validate subdomain format (alphanumeric and hyphens only, 3-20 chars)
    if (!isValidSubdomain(subdomain)) {
      return null;
    }

    return subdomain;
  } catch (error) {
    console.error('Error extracting subdomain:', error);
    return null;
  }
};

/**
 * Validates a subdomain string
 * @param subdomain - The subdomain to validate
 * @returns True if valid, false otherwise
 */
export const isValidSubdomain = (subdomain: string): boolean => {
  if (!subdomain) return false;

  // Check length (3-20 characters)
  if (subdomain.length < 3 || subdomain.length > 20) {
    return false;
  }

  // Check format: alphanumeric and hyphens only
  // Must start and end with alphanumeric
  const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/i;
  if (!subdomainRegex.test(subdomain)) {
    return false;
  }

  // Check for reserved subdomains
  if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
    return false;
  }

  // No consecutive hyphens
  if (subdomain.includes('--')) {
    return false;
  }

  return true;
};

/**
 * Checks if the current URL has a valid subdomain
 * @returns True if a valid subdomain is present
 */
export const hasSubdomain = (): boolean => {
  return getSubdomain() !== null;
};

/**
 * Builds a full URL with the given subdomain
 * @param subdomain - The subdomain to use
 * @param path - Optional path to append
 * @returns The full URL
 */
export const buildSubdomainUrl = (subdomain: string, path: string = ''): string => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;

  // Remove existing subdomain if present
  const baseDomain = hostname.split('.').slice(-2).join('.');

  // Build URL with new subdomain
  let url = `${protocol}//${subdomain}.${baseDomain}`;

  // Add port if not standard
  if (port && port !== '80' && port !== '443') {
    url += `:${port}`;
  }

  // Add path
  if (path) {
    url += path.startsWith('/') ? path : `/${path}`;
  }

  return url;
};

/**
 * Normalizes a subdomain string for storage
 * @param subdomain - The subdomain to normalize
 * @returns Normalized subdomain (lowercase, trimmed)
 */
export const normalizeSubdomain = (subdomain: string): string => {
  return subdomain.trim().toLowerCase();
};

/**
 * Formats subdomain for display
 * @param subdomain - The subdomain to format
 * @returns Formatted subdomain with example domain
 */
export const formatSubdomainDisplay = (subdomain: string): string => {
  const hostname = window.location.hostname;
  const baseDomain = hostname.includes('localhost')
    ? 'example.com'
    : hostname.split('.').slice(-2).join('.');

  return `${subdomain}.${baseDomain}`;
};
