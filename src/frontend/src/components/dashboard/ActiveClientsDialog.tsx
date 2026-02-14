import { ClientsMetricDialog } from './ClientsMetricDialog';
import type { ClientSummary } from '../../backend';

interface ActiveClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientSummary[];
  isLoading: boolean;
}

export function ActiveClientsDialog({
  open,
  onOpenChange,
  clients,
  isLoading,
}: ActiveClientsDialogProps) {
  return (
    <ClientsMetricDialog
      open={open}
      onOpenChange={onOpenChange}
      clients={clients}
      isLoading={isLoading}
      title="Active Clients"
      description="Clients who are currently training"
      emptyMessage="No active clients"
      showPlanEndDate={true}
    />
  );
}
