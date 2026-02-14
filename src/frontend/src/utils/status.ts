import type { ExtendedClient, ClientSummary } from '../backend';

export type ClientStatus = 'active' | 'paused' | 'expired';
export type DisplayStatus = ClientStatus | 'expiring' | 'half' | 'full';

export const EXPIRING_WINDOW_DAYS = 10;

export function isClientActivated(client: ExtendedClient | ClientSummary): boolean {
  return client.activatedAt !== undefined && client.activatedAt !== null;
}

function getEndDate(client: ExtendedClient | ClientSummary): bigint | null {
  if ('subscriptions' in client) {
    // ExtendedClient
    if (!client.subscriptions || client.subscriptions.length === 0) return null;
    return client.subscriptions[client.subscriptions.length - 1].endDate;
  } else {
    // ClientSummary
    return client.subscriptionSummary?.endDate || null;
  }
}

export function getClientStatus(client: ExtendedClient | ClientSummary): ClientStatus {
  if (client.status === 'paused') {
    return 'paused';
  }

  const endDate = getEndDate(client);
  if (endDate) {
    const now = BigInt(Date.now() * 1_000_000);
    if (endDate <= now) {
      return 'expired';
    }
  }

  return 'active';
}

export function getDisplayStatus(client: ExtendedClient | ClientSummary): DisplayStatus {
  const activated = isClientActivated(client);

  if (!activated) {
    return client.onboardingState === 'half' ? 'half' : 'full';
  }

  if (client.status === 'paused') {
    return 'paused';
  }

  const endDate = getEndDate(client);
  if (endDate) {
    const now = BigInt(Date.now() * 1_000_000);
    const expiringWindowEnd = now + (BigInt(EXPIRING_WINDOW_DAYS) * 86_400_000_000_000n);
    if (endDate > now && endDate <= expiringWindowEnd) {
      return 'expiring';
    }
    if (endDate <= now) {
      return 'expired';
    }
  }

  return 'active';
}

export function computeClientMetrics(clients: ClientSummary[]): {
  active: number;
  paused: number;
  expired: number;
} {
  let active = 0;
  let paused = 0;
  let expired = 0;

  for (const client of clients) {
    if (!isClientActivated(client)) continue;

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
