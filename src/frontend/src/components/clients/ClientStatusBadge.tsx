import { Badge } from '@/components/ui/badge';
import type { DisplayStatus } from '../../utils/status';

interface ClientStatusBadgeProps {
  status: DisplayStatus;
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  if (status === 'paused') {
    return <Badge variant="secondary">Paused</Badge>;
  }
  
  if (status === 'expired') {
    return <Badge variant="destructive">Expired</Badge>;
  }
  
  if (status === 'expiring') {
    return <Badge variant="outline">Expiring Soon</Badge>;
  }
  
  if (status === 'active') {
    return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>;
  }
  
  // Onboarding states
  if (status === 'half') {
    return <Badge variant="default">Onboarded (Half)</Badge>;
  }
  
  if (status === 'full') {
    return <Badge variant="default">Onboarded (Full)</Badge>;
  }
  
  // Fallback (should never reach here)
  return <Badge variant="outline">Unknown</Badge>;
}
