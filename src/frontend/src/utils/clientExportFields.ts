import type { ExtendedClient } from '../backend';
import { formatDate } from './format';
import type { DisplayStatus } from './status';

export interface ClientExportField {
  key: string;
  label: string;
  description: string;
  accessor: (client: ExtendedClient) => string | number;
}

function displayStatusToString(status: DisplayStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'paused':
      return 'Paused';
    case 'expired':
      return 'Expired';
    case 'expiring':
      return 'Expiring';
    case 'half':
      return 'Half Onboarded';
    case 'full':
      return 'Full Onboarded';
    default:
      return 'Unknown';
  }
}

function getCurrentSubscription(client: ExtendedClient) {
  if (!client.subscriptions || client.subscriptions.length === 0) return null;
  return client.subscriptions[client.subscriptions.length - 1];
}

export const CLIENT_EXPORT_FIELDS: ClientExportField[] = [
  {
    key: 'code',
    label: 'Client Code',
    description: 'Unique identifier for the client',
    accessor: (client) => `#${client.code.toString().padStart(2, '0')}`,
  },
  {
    key: 'name',
    label: 'Name',
    description: 'Client full name',
    accessor: (client) => client.name,
  },
  {
    key: 'mobileNumber',
    label: 'Mobile Number',
    description: 'Contact phone number',
    accessor: (client) => client.mobileNumber,
  },
  {
    key: 'planDurationDays',
    label: 'Plan Duration (days)',
    description: 'Total duration of the current plan in days',
    accessor: (client) => {
      const currentSub = getCurrentSubscription(client);
      return currentSub ? Number(currentSub.planDurationDays) : 0;
    },
  },
  {
    key: 'startDate',
    label: 'Start Date',
    description: 'Plan start date',
    accessor: (client) => {
      const currentSub = getCurrentSubscription(client);
      return currentSub ? formatDate(currentSub.startDate) : 'Not activated';
    },
  },
  {
    key: 'endDate',
    label: 'End Date',
    description: 'Plan end date',
    accessor: (client) => {
      const currentSub = getCurrentSubscription(client);
      return currentSub ? formatDate(currentSub.endDate) : 'Not activated';
    },
  },
  {
    key: 'status',
    label: 'Status',
    description: 'Current client status',
    accessor: (client) => client.status,
  },
  {
    key: 'onboardingState',
    label: 'Onboarding State',
    description: 'Onboarding completion status',
    accessor: (client) => client.onboardingState === 'half' ? 'Half' : 'Full',
  },
  {
    key: 'followUpDay',
    label: 'Follow-up Day',
    description: 'Scheduled follow-up day of the week',
    accessor: (client) => client.followUpDay || 'Not set',
  },
  {
    key: 'notes',
    label: 'Notes',
    description: 'Additional notes about the client',
    accessor: (client) => client.notes || '',
  },
  {
    key: 'latestWeight',
    label: 'Latest Weight (kg)',
    description: 'Most recent weight measurement',
    accessor: (client) => {
      if (!client.progress || client.progress.length === 0) return 'N/A';
      const latest = client.progress[client.progress.length - 1];
      return latest.weightKg;
    },
  },
  {
    key: 'latestNeck',
    label: 'Latest Neck (inch)',
    description: 'Most recent neck measurement',
    accessor: (client) => {
      if (!client.progress || client.progress.length === 0) return 'N/A';
      const latest = client.progress[client.progress.length - 1];
      return latest.neckInch;
    },
  },
  {
    key: 'latestChest',
    label: 'Latest Chest (inch)',
    description: 'Most recent chest measurement',
    accessor: (client) => {
      if (!client.progress || client.progress.length === 0) return 'N/A';
      const latest = client.progress[client.progress.length - 1];
      return latest.chestInch;
    },
  },
  {
    key: 'latestWaist',
    label: 'Latest Waist (inch)',
    description: 'Most recent waist measurement',
    accessor: (client) => {
      if (!client.progress || client.progress.length === 0) return 'N/A';
      const latest = client.progress[client.progress.length - 1];
      return latest.waistInch;
    },
  },
  {
    key: 'latestHips',
    label: 'Latest Hips (inch)',
    description: 'Most recent hips measurement',
    accessor: (client) => {
      if (!client.progress || client.progress.length === 0) return 'N/A';
      const latest = client.progress[client.progress.length - 1];
      return latest.hipsInch;
    },
  },
  {
    key: 'latestThigh',
    label: 'Latest Thigh (inch)',
    description: 'Most recent thigh measurement',
    accessor: (client) => {
      if (!client.progress || client.progress.length === 0) return 'N/A';
      const latest = client.progress[client.progress.length - 1];
      return latest.thighInch;
    },
  },
  {
    key: 'progressEntries',
    label: 'Progress Entries',
    description: 'Total number of progress records',
    accessor: (client) => client.progress?.length || 0,
  },
  {
    key: 'totalPausedDuration',
    label: 'Total Paused Duration (days)',
    description: 'Total time the client has been paused',
    accessor: (client) => {
      const nanoseconds = Number(client.totalPausedDuration);
      const days = Math.floor(nanoseconds / (86_400_000_000_000));
      return days;
    },
  },
];
