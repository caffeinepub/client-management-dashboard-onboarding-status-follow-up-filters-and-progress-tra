import type { ExtendedClient } from '../backend';
import { formatDate, formatDateTime } from './format';
import { formatClientCode } from './clientCode';
import { getDisplayStatus } from './status';

export interface ClientExportField {
  key: string;
  label: string;
  description?: string;
  accessor: (client: ExtendedClient) => string | number | boolean;
}

function displayStatusToString(client: ExtendedClient): string {
  const status = getDisplayStatus(client);
  if (status.type === 'onboarded') {
    return status.state === 'half' ? 'Half Onboarded' : 'Full Onboarded';
  }
  return status.type.charAt(0).toUpperCase() + status.type.slice(1);
}

export const CLIENT_EXPORT_FIELDS: ClientExportField[] = [
  {
    key: 'code',
    label: 'Client Code',
    description: 'Unique client identifier',
    accessor: (client) => formatClientCode(client.code),
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
    key: 'status',
    label: 'Status',
    description: 'Current client status',
    accessor: (client) => displayStatusToString(client),
  },
  {
    key: 'onboardingState',
    label: 'Onboarding State',
    description: 'Half or Full onboarding',
    accessor: (client) => client.onboardingState === 'half' ? 'Half' : 'Full',
  },
  {
    key: 'planDurationDays',
    label: 'Plan Duration (Days)',
    description: 'Total plan duration in days',
    accessor: (client) => Number(client.planDurationDays),
  },
  {
    key: 'startDate',
    label: 'Start Date',
    description: 'Plan start date',
    accessor: (client) => client.startDate ? formatDate(client.startDate) : 'Not activated',
  },
  {
    key: 'endDate',
    label: 'End Date',
    description: 'Plan end date',
    accessor: (client) => client.endDate ? formatDate(client.endDate) : 'Not activated',
  },
  {
    key: 'activatedAt',
    label: 'Activated At',
    description: 'When the client was activated',
    accessor: (client) => client.activatedAt ? formatDate(client.activatedAt) : 'Not activated',
  },
  {
    key: 'followUpDay',
    label: 'Follow-up Day',
    description: 'Scheduled follow-up day of week',
    accessor: (client) => client.followUpDay 
      ? client.followUpDay.charAt(0).toUpperCase() + client.followUpDay.slice(1)
      : 'Not set',
  },
  {
    key: 'notes',
    label: 'Notes',
    description: 'Additional client notes',
    accessor: (client) => client.notes || '',
  },
  {
    key: 'totalPausedDuration',
    label: 'Total Paused Duration (Days)',
    description: 'Total time paused in days',
    accessor: (client) => {
      const nanoseconds = Number(client.totalPausedDuration);
      const days = Math.floor(nanoseconds / (86_400_000_000_000));
      return days;
    },
  },
  {
    key: 'pauseCount',
    label: 'Pause Count',
    description: 'Number of times paused',
    accessor: (client) => client.pauseEntries.length,
  },
  {
    key: 'progressCount',
    label: 'Progress Entries',
    description: 'Number of progress records',
    accessor: (client) => client.progress.length,
  },
  {
    key: 'followUpCount',
    label: 'Follow-up Count',
    description: 'Number of follow-up records',
    accessor: (client) => client.followUpHistory.length,
  },
  {
    key: 'latestWeight',
    label: 'Latest Weight (kg)',
    description: 'Most recent weight measurement',
    accessor: (client) => {
      if (client.progress.length === 0) return 'N/A';
      const latest = client.progress[client.progress.length - 1];
      return latest.weightKg;
    },
  },
  {
    key: 'latestNeck',
    label: 'Latest Neck (inch)',
    description: 'Most recent neck measurement',
    accessor: (client) => {
      if (client.progress.length === 0) return 'N/A';
      const latest = client.progress[client.progress.length - 1];
      return latest.neckInch;
    },
  },
  {
    key: 'latestChest',
    label: 'Latest Chest (inch)',
    description: 'Most recent chest measurement',
    accessor: (client) => {
      if (client.progress.length === 0) return 'N/A';
      const latest = client.progress[client.progress.length - 1];
      return latest.chestInch;
    },
  },
  {
    key: 'latestWaist',
    label: 'Latest Waist (inch)',
    description: 'Most recent waist measurement',
    accessor: (client) => {
      if (client.progress.length === 0) return 'N/A';
      const latest = client.progress[client.progress.length - 1];
      return latest.waistInch;
    },
  },
  {
    key: 'latestHips',
    label: 'Latest Hips (inch)',
    description: 'Most recent hips measurement',
    accessor: (client) => {
      if (client.progress.length === 0) return 'N/A';
      const latest = client.progress[client.progress.length - 1];
      return latest.hipsInch;
    },
  },
  {
    key: 'latestThigh',
    label: 'Latest Thigh (inch)',
    description: 'Most recent thigh measurement',
    accessor: (client) => {
      if (client.progress.length === 0) return 'N/A';
      const latest = client.progress[client.progress.length - 1];
      return latest.thighInch;
    },
  },
  {
    key: 'latestProgressDate',
    label: 'Latest Progress Date',
    description: 'Date of most recent progress entry',
    accessor: (client) => {
      if (client.progress.length === 0) return 'N/A';
      const latest = client.progress[client.progress.length - 1];
      return formatDate(latest.timestamp);
    },
  },
  {
    key: 'lastFollowUpDate',
    label: 'Last Follow-up Date',
    description: 'Date of most recent follow-up',
    accessor: (client) => {
      if (client.followUpHistory.length === 0) return 'N/A';
      const latest = client.followUpHistory[client.followUpHistory.length - 1];
      return formatDate(latest.timestamp);
    },
  },
  {
    key: 'lastFollowUpStatus',
    label: 'Last Follow-up Status',
    description: 'Status of most recent follow-up',
    accessor: (client) => {
      if (client.followUpHistory.length === 0) return 'N/A';
      const latest = client.followUpHistory[client.followUpHistory.length - 1];
      return latest.done ? 'Done' : 'Not Done';
    },
  },
];
