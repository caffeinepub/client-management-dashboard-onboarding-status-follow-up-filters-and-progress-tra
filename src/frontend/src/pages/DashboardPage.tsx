import { useMemo, useState } from 'react';
import { useGetClientSummaries, useGetExpiringClients } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock, TrendingUp } from 'lucide-react';
import { isClientActivated, getClientStatus } from '../utils/status';
import { getRenewalOpportunitiesThisMonth } from '../utils/renewalOpportunities';
import { RenewalOpportunitiesThisMonthDialog } from '../components/dashboard/RenewalOpportunitiesThisMonthDialog';

export function DashboardPage() {
  const { data: summaries, isLoading } = useGetClientSummaries();
  const { data: expiringClients } = useGetExpiringClients();
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);

  const metrics = useMemo(() => {
    if (!summaries) {
      return {
        totalClients: 0,
        activeClients: 0,
        pausedClients: 0,
        expiringClients: 0,
        onboardingClients: 0,
        renewalOpportunities: 0,
      };
    }

    const allActivated = summaries.activated;
    const activeClients = allActivated.filter(c => getClientStatus(c) === 'active').length;
    const pausedClients = allActivated.filter(c => c.status === 'paused').length;
    const onboardingClients = summaries.half.length + summaries.full.length;
    
    // Calculate renewal opportunities (clients expiring this month)
    const renewalOpportunities = getRenewalOpportunitiesThisMonth(allActivated).length;

    return {
      totalClients: allActivated.length,
      activeClients,
      pausedClients,
      expiringClients: expiringClients?.length || 0,
      onboardingClients,
      renewalOpportunities,
    };
  }, [summaries, expiringClients]);

  const renewalOpportunitiesClients = useMemo(() => {
    if (!summaries) return [];
    return getRenewalOpportunitiesThisMonth(summaries.activated);
  }, [summaries]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your fitness coaching business</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalClients}</div>
            <p className="text-xs text-muted-foreground">Active memberships</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeClients}</div>
            <p className="text-xs text-muted-foreground">Currently training</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused Clients</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pausedClients}</div>
            <p className="text-xs text-muted-foreground">Temporarily inactive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.expiringClients}</div>
            <p className="text-xs text-muted-foreground">Within 10 days</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => setShowRenewalDialog(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewal Opportunities</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.renewalOpportunities}</div>
            <p className="text-xs text-muted-foreground">Expiring this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarding</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.onboardingClients}</div>
            <p className="text-xs text-muted-foreground">Pending activation</p>
          </CardContent>
        </Card>
      </div>

      <RenewalOpportunitiesThisMonthDialog
        open={showRenewalDialog}
        onOpenChange={setShowRenewalDialog}
        clients={renewalOpportunitiesClients}
        isLoading={isLoading}
      />
    </div>
  );
}
