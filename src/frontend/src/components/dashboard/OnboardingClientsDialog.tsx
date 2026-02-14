import { ClientsMetricDialog } from './ClientsMetricDialog';
import type { ClientSummary } from '../../backend';

interface OnboardingClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientSummary[];
  isLoading: boolean;
}

export function OnboardingClientsDialog({
  open,
  onOpenChange,
  clients,
  isLoading,
}: OnboardingClientsDialogProps) {
  return (
    <ClientsMetricDialog
      open={open}
      onOpenChange={onOpenChange}
      clients={clients}
      isLoading={isLoading}
      title="Onboarding Clients"
      description="Clients pending activation"
      emptyMessage="No clients in onboarding"
      showOnboardingState={true}
    />
  );
}
