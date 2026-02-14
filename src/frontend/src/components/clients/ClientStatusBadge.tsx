import { Badge } from '@/components/ui/badge';
import { OnboardingState } from '../../backend';
import type { DisplayStatus } from '../../utils/status';

interface ClientStatusBadgeProps {
  status: DisplayStatus;
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  if (status.type === 'paused') {
    return <Badge variant="secondary">Paused</Badge>;
  }
  
  if (status.type === 'expired') {
    return <Badge variant="destructive">Expired</Badge>;
  }
  
  if (status.type === 'expiring') {
    return <Badge variant="outline">Expiring Soon</Badge>;
  }
  
  if (status.type === 'active') {
    return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>;
  }
  
  // Onboarded state
  const label = status.state === OnboardingState.half ? 'Onboarded (Half)' : 'Onboarded (Full)';
  return <Badge variant="default">{label}</Badge>;
}
