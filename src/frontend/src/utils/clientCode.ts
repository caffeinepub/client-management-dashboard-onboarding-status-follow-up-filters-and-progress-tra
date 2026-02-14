/**
 * Formats a client code for display with zero-padding (e.g., 1 -> "#01", 12 -> "#12")
 */
export function formatClientCode(code: bigint | number | string): string {
  const numericCode = typeof code === 'bigint' ? Number(code) : typeof code === 'string' ? parseInt(code, 10) : code;
  return `#${numericCode.toString().padStart(2, '0')}`;
}

/**
 * Normalizes a search query to match client codes with or without '#' and with or without leading zeros
 * Returns the numeric string representation for comparison
 */
export function normalizeClientCodeQuery(query: string): string {
  // Remove '#' if present and any leading zeros
  const cleaned = query.replace(/^#/, '').replace(/^0+/, '');
  return cleaned || '0';
}

/**
 * Checks if a client code matches a search query (handles '#01', '01', '1', etc.)
 */
export function matchesClientCodeQuery(clientCode: bigint | number | string, query: string): boolean {
  const numericCode = typeof clientCode === 'bigint' ? Number(clientCode) : typeof clientCode === 'string' ? parseInt(clientCode, 10) : clientCode;
  const normalizedQuery = normalizeClientCodeQuery(query);
  
  // Match if the numeric code equals the normalized query
  return numericCode.toString() === normalizedQuery;
}
