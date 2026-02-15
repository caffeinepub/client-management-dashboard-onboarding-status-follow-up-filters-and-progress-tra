import { useMemo, useState } from 'react';
import { useGetAllClientSummaries, useGetExpiringClients } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock, TrendingUp } from 'lucide-react';
import { getClientStatus } from '../utils/status';
import { getRenewalOpportunitiesThisMonth } from '../utils/renewalOpportunities';
import { TotalClientsDialog } from '../components/dashboard/TotalClientsDialog';
import { ActiveClientsDialog } from '../components/dashboard/ActiveClientsDialog';
import { PausedClientsDialog } from '../components/dashboard/PausedClientsDialog';
import { ExpiringSoonClientsDialog } from '../components/dashboard/ExpiringSoonClientsDialog';
import { OnboardingClientsDialog } from '../components/dashboard/OnboardingClientsDialog';
import { RenewalOpportunitiesThisMonthDialog } from '../components/dashboard/RenewalOpportunitiesThisMonthDialog';

export function DashboardPage() {
  const { data: allSummaries, isLoading } = useGetAllClientSummaries();
  const { data: expiringClients } = useGetExpiringClients();

  const [totalDialogOpen, setTotalDialogOpen] = useState(false);
  const [activeDialogOpen, setActiveDialogOpen] = useState(false);
  const [pausedDialogOpen, setPausedDialogOpen] = useState(false);
  const [expiringDialogOpen, setExpiringDialogOpen] = useState(false);
  const [onboardingDialogOpen, setOnboardingDialogOpen] = useState(false);
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);

  const metrics = useMemo(() => {
    if (!allSummaries) {
      return {
        total: 0,
        active: 0,
        paused: 0,
        expiring: 0,
        halfOnboarded: 0,
        fullOnboarded: 0,
        renewalOpportunities: 0,
        activatedClients: [],
        halfOnboardedClients: [],
        fullOnboardedClients: [],
        pausedClients: [],
        renewalOpportunitiesClients: [],
      };
    }

    const activated = allSummaries.filter((c) => c.activatedAt !== undefined);
    const halfOnboarded = allSummaries.filter(
      (c) => c.onboardingState === 'half' && c.activatedAt === undefined
    );
    const fullOnboarded = allSummaries.filter(
      (c) => c.onboardingState === 'full' && c.activatedAt === undefined
    );

    const active = activated.filter((c) => {
      const status = getClientStatus(c);
      return status !== 'paused' && status !== 'expired';
    });

    const paused = activated.filter((c) => getClientStatus(c) === 'paused');

    const renewalOpportunitiesClients = getRenewalOpportunitiesThisMonth(activated);

    return {
      total: allSummaries.length,
      active: active.length,
      paused: paused.length,
      expiring: expiringClients?.length || 0,
      halfOnboarded: halfOnboarded.length,
      fullOnboarded: fullOnboarded.length,
      renewalOpportunities: renewalOpportunitiesClients.length,
      activatedClients: activated,
      halfOnboardedClients: halfOnboarded,
      fullOnboardedClients: fullOnboarded,
      pausedClients: paused,
      renewalOpportunitiesClients,
    };
  }, [allSummaries, expiringClients]);

  const onboardingClientsList = useMemo(() => {
    return [...metrics.halfOnboardedClients, ...metrics.fullOnboardedClients];
  }, [metrics.halfOnboardedClients, metrics.fullOnboardedClients]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your fitness coaching business</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Clients */}
        <Card
          className="cursor-pointer transition-all hover:shadow-card-hover hover:scale-[1.02] border-2"
          onClick={() => setTotalDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              Total Clients
            </CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              All clients in your system
            </p>
          </CardContent>
        </Card>

        {/* Active Clients */}
        <Card
          className="cursor-pointer transition-all hover:shadow-card-hover hover:scale-[1.02] border-2"
          onClick={() => setActiveDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              Active Clients
            </CardTitle>
            <UserCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{metrics.active}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              Currently active subscriptions
            </p>
          </CardContent>
        </Card>

        {/* Paused Clients */}
        <Card
          className="cursor-pointer transition-all hover:shadow-card-hover hover:scale-[1.02] border-2"
          onClick={() => setPausedDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              Paused Clients
            </CardTitle>
            <UserX className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{metrics.paused}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              Temporarily paused subscriptions
            </p>
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card
          className="cursor-pointer transition-all hover:shadow-card-hover hover:scale-[1.02] border-2"
          onClick={() => setExpiringDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              Expiring Soon
            </CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{metrics.expiring}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              Plans ending in next 10 days
            </p>
          </CardContent>
        </Card>

        {/* Onboarding */}
        <Card
          className="cursor-pointer transition-all hover:shadow-card-hover hover:scale-[1.02] border-2"
          onClick={() => setOnboardingDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              Onboarding
            </CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {metrics.halfOnboarded + metrics.fullOnboarded}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              {metrics.halfOnboarded} half, {metrics.fullOnboarded} full
            </p>
          </CardContent>
        </Card>

        {/* Renewal Opportunities */}
        <Card
          className="cursor-pointer transition-all hover:shadow-card-hover hover:scale-[1.02] border-2"
          onClick={() => setRenewalDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              Renewals This Month
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{metrics.renewalOpportunities}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              Plans expiring this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <TotalClientsDialog
        open={totalDialogOpen}
        onOpenChange={setTotalDialogOpen}
        clients={metrics.activatedClients}
        isLoading={isLoading}
      />

      <ActiveClientsDialog
        open={activeDialogOpen}
        onOpenChange={setActiveDialogOpen}
        clients={metrics.activatedClients.filter((c) => {
          const status = getClientStatus(c);
          return status !== 'paused' && status !== 'expired';
        })}
        isLoading={isLoading}
      />

      <PausedClientsDialog
        open={pausedDialogOpen}
        onOpenChange={setPausedDialogOpen}
        clients={metrics.pausedClients}
        isLoading={isLoading}
      />

      <ExpiringSoonClientsDialog
        open={expiringDialogOpen}
        onOpenChange={setExpiringDialogOpen}
        clients={expiringClients || []}
        isLoading={isLoading}
      />

      <OnboardingClientsDialog
        open={onboardingDialogOpen}
        onOpenChange={setOnboardingDialogOpen}
        halfClients={metrics.halfOnboardedClients}
        fullClients={metrics.fullOnboardedClients}
        isLoading={isLoading}
      />

      <RenewalOpportunitiesThisMonthDialog
        open={renewalDialogOpen}
        onOpenChange={setRenewalDialogOpen}
        clients={metrics.renewalOpportunitiesClients}
        isLoading={isLoading}
      />
    </div>
  );
}
