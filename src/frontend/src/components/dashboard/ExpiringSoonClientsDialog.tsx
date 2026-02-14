import { ClientsMetricDialog } from './ClientsMetricDialog';
import type { ClientSummary } from '../../backend';

interface ExpiringSoonClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientSummary[];
  isLoading: boolean;
}

export function ExpiringSoonClientsDialog({
  open,
  onOpenChange,
  clients,
  isLoading,
}: ExpiringSoonClientsDialogProps) {
  return (
    <ClientsMetricDialog
      open={open}
      onOpenChange={onOpenChange}
      clients={clients}
      isLoading={isLoading}
      title="Expiring Soon"
      description="Clients whose plan is expiring within 10 days"
      emptyMessage="No clients expiring soon"
      showPlanEndDate={true}
    />
  );
}
