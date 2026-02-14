import { useMemo, useState } from 'react';
import { useGetClientSummaries, useGetExpiringClients } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock, TrendingUp } from 'lucide-react';
import { getClientStatus } from '../utils/status';
import { getRenewalOpportunitiesThisMonth } from '../utils/renewalOpportunities';
import { RenewalOpportunitiesThisMonthDialog } from '../components/dashboard/RenewalOpportunitiesThisMonthDialog';
import { TotalClientsDialog } from '../components/dashboard/TotalClientsDialog';
import { ActiveClientsDialog } from '../components/dashboard/ActiveClientsDialog';
import { PausedClientsDialog } from '../components/dashboard/PausedClientsDialog';
import { ExpiringSoonClientsDialog } from '../components/dashboard/ExpiringSoonClientsDialog';
import { OnboardingClientsDialog } from '../components/dashboard/OnboardingClientsDialog';

export function DashboardPage() {
  const { data: summaries, isLoading } = useGetClientSummaries();
  const { data: expiringClients } = useGetExpiringClients();
  
  const [showTotalDialog, setShowTotalDialog] = useState(false);
  const [showActiveDialog, setShowActiveDialog] = useState(false);
  const [showPausedDialog, setShowPausedDialog] = useState(false);
  const [showExpiringDialog, setShowExpiringDialog] = useState(false);
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [showOnboardingDialog, setShowOnboardingDialog] = useState(false);

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

  // Derive client lists for each dialog
  const totalClientsList = useMemo(() => {
    if (!summaries) return [];
    return summaries.activated;
  }, [summaries]);

  const activeClientsList = useMemo(() => {
    if (!summaries) return [];
    return summaries.activated.filter(c => getClientStatus(c) === 'active');
  }, [summaries]);

  const pausedClientsList = useMemo(() => {
    if (!summaries) return [];
    return summaries.activated.filter(c => c.status === 'paused');
  }, [summaries]);

  const expiringClientsList = useMemo(() => {
    return expiringClients || [];
  }, [expiringClients]);

  const renewalOpportunitiesClients = useMemo(() => {
    if (!summaries) return [];
    return getRenewalOpportunitiesThisMonth(summaries.activated);
  }, [summaries]);

  const onboardingClientsList = useMemo(() => {
    if (!summaries) return [];
    return [...summaries.half, ...summaries.full];
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
        <Card 
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => setShowTotalDialog(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalClients}</div>
            <p className="text-xs text-muted-foreground">Active memberships</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => setShowActiveDialog(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeClients}</div>
            <p className="text-xs text-muted-foreground">Currently training</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => setShowPausedDialog(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused Clients</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pausedClients}</div>
            <p className="text-xs text-muted-foreground">Temporarily inactive</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => setShowExpiringDialog(true)}
        >
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

        <Card 
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => setShowOnboardingDialog(true)}
        >
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

      <TotalClientsDialog
        open={showTotalDialog}
        onOpenChange={setShowTotalDialog}
        clients={totalClientsList}
        isLoading={isLoading}
      />

      <ActiveClientsDialog
        open={showActiveDialog}
        onOpenChange={setShowActiveDialog}
        clients={activeClientsList}
        isLoading={isLoading}
      />

      <PausedClientsDialog
        open={showPausedDialog}
        onOpenChange={setShowPausedDialog}
        clients={pausedClientsList}
        isLoading={isLoading}
      />

      <ExpiringSoonClientsDialog
        open={showExpiringDialog}
        onOpenChange={setShowExpiringDialog}
        clients={expiringClientsList}
        isLoading={isLoading}
      />

      <RenewalOpportunitiesThisMonthDialog
        open={showRenewalDialog}
        onOpenChange={setShowRenewalDialog}
        clients={renewalOpportunitiesClients}
        isLoading={isLoading}
      />

      <OnboardingClientsDialog
        open={showOnboardingDialog}
        onOpenChange={setShowOnboardingDialog}
        clients={onboardingClientsList}
        isLoading={isLoading}
      />
    </div>
  );
}
