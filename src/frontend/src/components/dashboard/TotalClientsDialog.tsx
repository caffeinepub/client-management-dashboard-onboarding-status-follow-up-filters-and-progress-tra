import { ClientsMetricDialog } from './ClientsMetricDialog';
import type { ClientSummary } from '../../backend';

interface TotalClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientSummary[];
  isLoading: boolean;
}

export function TotalClientsDialog({
  open,
  onOpenChange,
  clients,
  isLoading,
}: TotalClientsDialogProps) {
  return (
    <ClientsMetricDialog
      open={open}
      onOpenChange={onOpenChange}
      clients={clients}
      isLoading={isLoading}
      title="Total Clients"
      description="All clients with active memberships"
      emptyMessage="No clients found"
      showPlanEndDate={false}
    />
  );
}
