import { ExtendedClient, FollowUpDay, FollowUpEntry } from '../backend';

/**
 * Get the day of week (0-6, where 0 is Monday) from a Date object
 */
function getDayOfWeek(date: Date): number {
  const day = date.getDay();
  // Convert Sunday (0) to 6, and shift others down by 1
  return day === 0 ? 6 : day - 1;
}

/**
 * Convert FollowUpDay enum to day number (0-6, where 0 is Monday)
 */
function followUpDayToNumber(day: FollowUpDay): number {
  const mapping: Record<FollowUpDay, number> = {
    [FollowUpDay.monday]: 0,
    [FollowUpDay.tuesday]: 1,
    [FollowUpDay.wednesday]: 2,
    [FollowUpDay.thursday]: 3,
    [FollowUpDay.friday]: 4,
    [FollowUpDay.saturday]: 5,
    [FollowUpDay.sunday]: 6,
  };
  return mapping[day];
}

/**
 * Check if today is the follow-up day for the client
 */
function isTodayFollowUpDay(followUpDay: FollowUpDay): boolean {
  const today = new Date();
  const todayDayOfWeek = getDayOfWeek(today);
  const followUpDayNumber = followUpDayToNumber(followUpDay);
  return todayDayOfWeek === followUpDayNumber;
}

/**
 * Check if a follow-up entry was recorded today
 */
function hasFollowUpToday(history: FollowUpEntry[]): boolean {
  if (history.length === 0) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  return history.some((entry) => {
    const entryDate = new Date(Number(entry.timestamp) / 1_000_000);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === todayMs;
  });
}

/**
 * Determine if a follow-up prompt should be shown for a client
 */
export function isFollowUpDue(client: ExtendedClient): boolean {
  // Must have a follow-up day configured
  if (!client.followUpDay) return false;

  // Must be activated
  if (!client.activatedAt) return false;

  // Check if today is the follow-up day
  if (!isTodayFollowUpDay(client.followUpDay)) return false;

  // Check if already recorded today
  return !hasFollowUpToday(client.followUpHistory);
}

/**
 * Get the latest follow-up entry from history
 */
export function getLatestFollowUpEntry(history: FollowUpEntry[]): FollowUpEntry | null {
  if (history.length === 0) return null;

  return history.reduce((latest, entry) => {
    return Number(entry.timestamp) > Number(latest.timestamp) ? entry : latest;
  });
}

/**
 * Get the follow-up status for display
 */
export function getFollowUpStatus(client: ExtendedClient): {
  isDone: boolean;
  latestEntry: FollowUpEntry | null;
} {
  const latestEntry = getLatestFollowUpEntry(client.followUpHistory);
  
  return {
    isDone: latestEntry?.done ?? false,
    latestEntry,
  };
}
