import type { ExtendedClient } from '../backend';
import { OnboardingState } from '../backend';

export type ClientStatus = 'active' | 'paused' | 'expired' | 'expiring';

export type DisplayStatus =
  | { type: 'active' }
  | { type: 'paused' }
  | { type: 'expired' }
  | { type: 'expiring' }
  | { type: 'onboarded'; state: OnboardingState };

export function isClientActivated(client: ExtendedClient): boolean {
  return client.activatedAt !== undefined && client.activatedAt !== null;
}

export function getClientStatus(client: ExtendedClient): ClientStatus {
  if (client.status === 'paused') {
    return 'paused';
  }

  if (!isClientActivated(client)) {
    return 'active';
  }

  if (!client.endDate) {
    return 'active';
  }

  const now = Date.now() * 1_000_000;
  const endDate = Number(client.endDate);
  const threeDaysInNano = 3 * 24 * 60 * 60 * 1_000_000_000;

  if (endDate <= now) {
    return 'expired';
  }

  if (endDate - now <= threeDaysInNano) {
    return 'expiring';
  }

  return 'active';
}

export function getDisplayStatus(client: ExtendedClient): DisplayStatus {
  const activated = isClientActivated(client);

  if (!activated) {
    return { type: 'onboarded', state: client.onboardingState };
  }

  const status = getClientStatus(client);
  return { type: status };
}

export function computeClientMetrics(clients: ExtendedClient[]): {
  active: number;
  paused: number;
  expired: number;
} {
  let active = 0;
  let paused = 0;
  let expired = 0;

  for (const client of clients) {
    if (!isClientActivated(client)) {
      continue;
    }

    const status = getClientStatus(client);
    if (status === 'paused') {
      paused++;
    } else if (status === 'expired') {
      expired++;
    } else {
      active++;
    }
  }

  return { active, paused, expired };
}
