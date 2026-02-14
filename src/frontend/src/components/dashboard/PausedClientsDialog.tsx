import { ClientsMetricDialog } from './ClientsMetricDialog';
import type { ClientSummary } from '../../backend';

interface PausedClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientSummary[];
  isLoading: boolean;
}

export function PausedClientsDialog({
  open,
  onOpenChange,
  clients,
  isLoading,
}: PausedClientsDialogProps) {
  return (
    <ClientsMetricDialog
      open={open}
      onOpenChange={onOpenChange}
      clients={clients}
      isLoading={isLoading}
      title="Paused Clients"
      description="Clients who have temporarily paused their training"
      emptyMessage="No paused clients"
      showPlanEndDate={true}
    />
  );
}
