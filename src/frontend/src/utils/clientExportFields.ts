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
    description: 'Client contact number',
    accessor: (client) => client.mobileNumber,
  },
  {
    key: 'onboardingState',
    label: 'Onboarding State',
    description: 'Half or Full onboarding status',
    accessor: (client) => (client.onboardingState === 'half' ? 'Half' : 'Full'),
  },
  {
    key: 'activatedAt',
    label: 'Activated At',
    description: 'Date when client was activated',
    accessor: (client) => (client.activatedAt ? formatDate(client.activatedAt) : 'Not Activated'),
  },
  {
    key: 'onboardingPlanDuration',
    label: 'Onboarding Plan Duration (Days)',
    description: 'Plan duration recorded during onboarding',
    accessor: (client) => 
      client.initialPlanDetails 
        ? Number(client.initialPlanDetails.planDurationDays) 
        : 'Not Recorded',
  },
  {
    key: 'onboardingExtraDays',
    label: 'Onboarding Extra Days',
    description: 'Extra days recorded during onboarding',
    accessor: (client) => 
      client.initialPlanDetails 
        ? Number(client.initialPlanDetails.extraDays) 
        : 'Not Recorded',
  },
  {
    key: 'currentPlanDuration',
    label: 'Current Plan Duration (Days)',
    description: 'Duration of current/latest subscription',
    accessor: (client) => {
      const sub = getCurrentSubscription(client);
      return sub ? Number(sub.planDurationDays) : 'No Subscription';
    },
  },
  {
    key: 'currentExtraDays',
    label: 'Current Extra Days',
    description: 'Extra days in current/latest subscription',
    accessor: (client) => {
      const sub = getCurrentSubscription(client);
      return sub ? Number(sub.extraDays) : 'No Subscription';
    },
  },
  {
    key: 'planStartDate',
    label: 'Plan Start Date',
    description: 'Start date of current/latest subscription',
    accessor: (client) => {
      const sub = getCurrentSubscription(client);
      return sub ? formatDate(sub.startDate) : 'No Subscription';
    },
  },
  {
    key: 'planEndDate',
    label: 'Plan End Date',
    description: 'End date of current/latest subscription',
    accessor: (client) => {
      const sub = getCurrentSubscription(client);
      return sub ? formatDate(sub.endDate) : 'No Subscription';
    },
  },
  {
    key: 'followUpDay',
    label: 'Follow-Up Day',
    description: 'Scheduled day for weekly follow-ups',
    accessor: (client) => {
      if (!client.followUpDay) return 'Not Set';
      return client.followUpDay.charAt(0).toUpperCase() + client.followUpDay.slice(1);
    },
  },
  {
    key: 'status',
    label: 'Status',
    description: 'Current client status',
    accessor: (client) => (client.status === 'active' ? 'Active' : 'Paused'),
  },
  {
    key: 'pauseTime',
    label: 'Pause Time',
    description: 'When the client was paused',
    accessor: (client) => (client.pauseTime ? formatDate(client.pauseTime) : 'Not Paused'),
  },
  {
    key: 'totalPausedDuration',
    label: 'Total Paused Duration (Days)',
    description: 'Total time client has been paused',
    accessor: (client) => {
      const durationNs = Number(client.totalPausedDuration);
      const durationDays = Math.floor(durationNs / (86_400_000_000_000));
      return durationDays;
    },
  },
  {
    key: 'notes',
    label: 'Notes',
    description: 'Additional notes about the client',
    accessor: (client) => client.notes || 'No Notes',
  },
  {
    key: 'progressEntries',
    label: 'Progress Entries',
    description: 'Number of progress records',
    accessor: (client) => client.progress?.length || 0,
  },
  {
    key: 'followUpEntries',
    label: 'Follow-Up Entries',
    description: 'Number of follow-up records',
    accessor: (client) => client.followUpHistory?.length || 0,
  },
  {
    key: 'pauseEntries',
    label: 'Pause Entries',
    description: 'Number of pause records',
    accessor: (client) => client.pauseEntries?.length || 0,
  },
  {
    key: 'subscriptionCount',
    label: 'Subscription Count',
    description: 'Total number of subscriptions',
    accessor: (client) => client.subscriptions?.length || 0,
  },
];
