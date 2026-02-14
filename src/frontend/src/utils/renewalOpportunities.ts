import type { ClientSummary } from '../backend';
import { isClientActivated, getClientStatus } from './status';

/**
 * Get the start and end boundaries of the current calendar month.
 * Start: first day at 00:00:00.000
 * End: last day at 23:59:59.999
 */
export function getCurrentMonthBoundaries(): { start: bigint; end: bigint } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // First day of current month at 00:00:00.000
  const startDate = new Date(year, month, 1, 0, 0, 0, 0);
  const start = BigInt(startDate.getTime() * 1_000_000);

  // Last day of current month at 23:59:59.999
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const end = BigInt(endDate.getTime() * 1_000_000);

  return { start, end };
}

/**
 * Filter clients whose subscription end date falls within the current month.
 * Only includes activated, currently active (not paused, not expired) clients.
 */
export function getRenewalOpportunitiesThisMonth(clients: ClientSummary[]): ClientSummary[] {
  const { start, end } = getCurrentMonthBoundaries();

  return clients.filter((client) => {
    // Must be activated
    if (!isClientActivated(client)) return false;

    // Must be currently active (not paused, not expired)
    const status = getClientStatus(client);
    if (status !== 'active') return false;

    // Must have a subscription end date
    const endDate = client.subscriptionSummary?.endDate;
    if (!endDate) return false;

    // End date must fall within current month (inclusive)
    return endDate >= start && endDate <= end;
  });
}

/**
 * Count renewal opportunities for the current month.
 */
export function countRenewalOpportunitiesThisMonth(clients: ClientSummary[]): number {
  return getRenewalOpportunitiesThisMonth(clients).length;
}
