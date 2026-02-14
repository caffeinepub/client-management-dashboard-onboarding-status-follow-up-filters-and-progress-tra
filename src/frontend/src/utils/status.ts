import type { ExtendedClient, ClientSummary } from '../backend';

export type ClientStatus = 'active' | 'paused' | 'expired';

export type DisplayStatus =
  | { type: 'active' }
  | { type: 'paused' }
  | { type: 'expired' }
  | { type: 'expiring' }
  | { type: 'onboarded'; state: 'half' | 'full' };

// Type guard to check if a client-like object has been activated
export function isClientActivated(client: { activatedAt?: bigint | null }): boolean {
  return client.activatedAt != null;
}

// Get the base status of a client (active, paused, expired)
export function getClientStatus(client: ExtendedClient | ClientSummary): ClientStatus {
  if (!isClientActivated(client)) {
    return 'active'; // Non-activated clients default to active for filtering
  }

  if (client.status === 'paused') {
    return 'paused';
  }

  // Check if expired
  if (client.endDate) {
    const now = BigInt(Date.now() * 1_000_000);
    if (client.endDate <= now) {
      return 'expired';
    }
  }

  return 'active';
}

// Get the display status for UI rendering
export function getDisplayStatus(client: ExtendedClient | ClientSummary): DisplayStatus {
  if (!isClientActivated(client)) {
    return {
      type: 'onboarded',
      state: client.onboardingState === 'half' ? 'half' : 'full',
    };
  }

  const status = getClientStatus(client);

  if (status === 'paused') {
    return { type: 'paused' };
  }

  if (status === 'expired') {
    return { type: 'expired' };
  }

  // Check if expiring (within 3 days)
  if (client.endDate) {
    const now = BigInt(Date.now() * 1_000_000);
    const threeDaysFromNow = now + (3n * 86_400_000_000_000n);
    if (client.endDate > now && client.endDate <= threeDaysFromNow) {
      return { type: 'expiring' };
    }
  }

  return { type: 'active' };
}

// Compute dashboard metrics from client summaries
export function computeClientMetrics(clients: (ExtendedClient | ClientSummary)[]): {
  active: number;
  paused: number;
  expired: number;
} {
  let active = 0;
  let paused = 0;
  let expired = 0;

  for (const client of clients) {
    // Only count activated clients in metrics
    if (!isClientActivated(client)) {
      continue;
    }

    const status = getClientStatus(client);
    if (status === 'active') {
      active++;
    } else if (status === 'paused') {
      paused++;
    } else if (status === 'expired') {
      expired++;
    }
  }

  return { active, paused, expired };
}
