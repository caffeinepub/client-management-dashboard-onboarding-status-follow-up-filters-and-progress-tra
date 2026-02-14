/**
 * Shared helpers to normalize and validate mobile numbers for onboarding
 */

/**
 * Normalize a mobile number by trimming whitespace
 */
export function normalizeMobileNumber(value: string): string {
  return value.trim();
}

/**
 * Validate a mobile number
 * Returns true if the number appears valid (non-empty after normalization)
 */
export function isValidMobileNumber(value: string): boolean {
  const normalized = normalizeMobileNumber(value);
  
  // Basic validation: must not be empty and should contain at least some digits
  if (normalized.length === 0) {
    return false;
  }
  
  // Check if it contains at least one digit
  if (!/\d/.test(normalized)) {
    return false;
  }
  
  return true;
}

/**
 * Get validation error message for a mobile number
 */
export function getMobileNumberError(value: string): string | null {
  const normalized = normalizeMobileNumber(value);
  
  if (normalized.length === 0) {
    return 'Mobile number is required';
  }
  
  if (!/\d/.test(normalized)) {
    return 'Mobile number must contain digits';
  }
  
  return null;
}
