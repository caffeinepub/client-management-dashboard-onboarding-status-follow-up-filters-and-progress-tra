import { useMemo, useState } from 'react';
import { useRouter } from '../hooks/useRouter';
import { useGetClientByCode, useGetClientProgress, useActivateClient, usePauseClient, useResumeClient, useRenewSubscription, useExpireMembership, useConvertToFullOnboarding, useRecordFollowUp } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Calendar, FileText, Loader2 } from 'lucide-react';
import { ClientStatusBadge } from '../components/clients/ClientStatusBadge';
import { ProgressEntryForm } from '../components/progress/ProgressEntryForm';
import { ProgressHistoryTable } from '../components/progress/ProgressHistoryTable';
import { ProgressCharts } from '../components/progress/ProgressCharts';
import { FollowUpSection } from '../components/clients/FollowUpSection';
import { SubscriptionsSection } from '../components/clients/SubscriptionsSection';
import { ClientPrimaryActionsCard } from '../components/clients/ClientPrimaryActionsCard';
import { ActivateClientDialog } from '../components/clients/ActivateClientDialog';
import { PauseClientDialog } from '../components/clients/PauseClientDialog';
import { RenewSubscriptionDialog } from '../components/clients/RenewSubscriptionDialog';
import { FollowUpPromptDialog } from '../components/clients/FollowUpPromptDialog';
import { getDisplayStatus, isClientActivated } from '../utils/status';
import { formatDate } from '../utils/format';
import { formatClientCode } from '../utils/clientCode';
import { toast } from 'sonner';
import { normalizeError } from '../utils/errors';
import type { FollowUpDay } from '../backend';

export function ClientProfilePage() {
  const { getClientCode, navigate } = useRouter();
  const clientCode = getClientCode();
  const { data: client, isLoading } = useGetClientByCode(clientCode);
  const { data: progress = [] } = useGetClientProgress(clientCode);

  const activateClient = useActivateClient();
  const pauseClient = usePauseClient();
  const resumeClient = useResumeClient();
  const renewSubscription = useRenewSubscription();
  const expireMembership = useExpireMembership();
  const convertToFull = useConvertToFullOnboarding();
  const recordFollowUp = useRecordFollowUp();

  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);

  const displayStatus = useMemo(() => {
    if (!client) return 'half';
    return getDisplayStatus(client);
  }, [client]);

  const isActivated = useMemo(() => {
    if (!client) return false;
    return isClientActivated(client);
  }, [client]);

  const handleActivate = () => {
    setActivateDialogOpen(true);
  };

  const handleActivateConfirm = async (startDate: Date, followUpDay: FollowUpDay) => {
    if (!clientCode || !client) return;

    try {
      // Use initial plan details if available, otherwise use defaults
      const planDurationDays = client.initialPlanDetails 
        ? BigInt(client.initialPlanDetails.planDurationDays)
        : BigInt(30); // Default 1 month
      const extraDays = client.initialPlanDetails 
        ? BigInt(client.initialPlanDetails.extraDays)
        : BigInt(0);

      await activateClient.mutateAsync({
        clientCode,
        planDurationDays,
        extraDays,
        startDate: BigInt(startDate.getTime() * 1_000_000), // Convert to nanoseconds
        followUpDay,
      });
      toast.success('Client activated successfully!');
      setActivateDialogOpen(false);
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handlePause = () => {
    setPauseDialogOpen(true);
  };

  const handlePauseConfirm = async (durationDays: number, reason: string) => {
    if (!clientCode) return;

    try {
      await pauseClient.mutateAsync({
        clientCode,
        durationDays: BigInt(durationDays),
        reason,
      });
      toast.success('Client paused successfully!');
      setPauseDialogOpen(false);
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleResume = async () => {
    if (!clientCode) return;

    try {
      await resumeClient.mutateAsync(clientCode);
      toast.success('Client resumed successfully!');
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleRenew = () => {
    setRenewDialogOpen(true);
  };

  const handleRenewConfirm = async (planDurationDays: number, extraDays: number, startDate: Date) => {
    if (!clientCode) return;

    try {
      await renewSubscription.mutateAsync({
        clientCode,
        planDurationDays: BigInt(planDurationDays),
        extraDays: BigInt(extraDays),
        startDate: BigInt(startDate.getTime() * 1_000_000), // Convert to nanoseconds
      });
      toast.success('Subscription renewed successfully!');
      setRenewDialogOpen(false);
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleExpire = async () => {
    if (!clientCode) return;
    if (!confirm('Are you sure you want to expire this membership immediately?')) return;

    try {
      await expireMembership.mutateAsync(clientCode);
      toast.success('Membership expired successfully!');
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleConvertToFull = async () => {
    if (!clientCode) return;

    try {
      await convertToFull.mutateAsync(clientCode);
      toast.success('Client converted to full onboarding!');
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleMarkFollowUpDone = () => {
    setFollowUpDialogOpen(true);
  };

  const handleFollowUpSubmit = async (done: boolean, notes: string) => {
    if (!clientCode || !client?.followUpDay) return;

    try {
      await recordFollowUp.mutateAsync({
        clientCode,
        followUpDay: client.followUpDay,
        done,
        notes,
      });
      toast.success('Follow-up recorded successfully!');
      setFollowUpDialogOpen(false);
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading client profile...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-2">
          <CardContent className="py-16 text-center">
            <h2 className="text-2xl font-bold mb-2">Client Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The client you're looking for doesn't exist or you don't have access to view it.
            </p>
            <Button onClick={() => navigate('clients')} className="font-semibold">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSubscription = client.subscriptions && client.subscriptions.length > 0
    ? client.subscriptions[client.subscriptions.length - 1]
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Button
            variant="ghost"
            onClick={() => navigate('clients')}
            className="mb-4 -ml-3 font-semibold"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h1 className="mb-2">{client.name}</h1>
              <p className="text-muted-foreground font-medium">
                {formatClientCode(client.code.toString())}
              </p>
            </div>
            <ClientStatusBadge status={displayStatus} />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{client.mobileNumber}</span>
          </div>
          {client.notes && (
            <div className="flex items-start gap-3 pt-2">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-semibold mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Details */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isActivated && currentSubscription ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Plan End Date</p>
                  <p className="font-medium">{formatDate(currentSubscription.endDate)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Plan Duration</p>
                  <p className="font-medium">{Number(currentSubscription.planDurationDays)} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Extra Days</p>
                  <p className="font-medium">{Number(currentSubscription.extraDays)} days</p>
                </div>
              </div>
            </div>
          ) : client.initialPlanDetails ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground mb-3 font-semibold">
                  Onboarding Plan Details (Not Yet Activated)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold">Plan Duration</p>
                    <p className="font-medium">{Number(client.initialPlanDetails.planDurationDays)} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold">Extra Days</p>
                    <p className="font-medium">{Number(client.initialPlanDetails.extraDays)} days</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t">
                    <p className="text-sm text-muted-foreground font-semibold">Total Duration</p>
                    <p className="font-bold text-lg">
                      {Number(client.initialPlanDetails.planDurationDays) + Number(client.initialPlanDetails.extraDays)} days
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                These plan details were recorded during onboarding. Activate the client to create the subscription and set a follow-up day.
              </p>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No plan details recorded yet</p>
              <p className="text-xs mt-1">Activate the client to set up their subscription</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Primary Actions */}
      <ClientPrimaryActionsCard
        client={client}
        onActivate={handleActivate}
        onPause={handlePause}
        onResume={handleResume}
        onRenew={handleRenew}
        onExpire={handleExpire}
        onConvertToFull={handleConvertToFull}
        isActivating={activateClient.isPending}
        isPausing={pauseClient.isPending}
        isResuming={resumeClient.isPending}
        isRenewing={renewSubscription.isPending}
        isExpiring={expireMembership.isPending}
        isConverting={convertToFull.isPending}
      />

      {/* Follow-Up Section (only for activated clients) */}
      {isActivated && <FollowUpSection client={client} onMarkDone={handleMarkFollowUpDone} />}

      {/* Subscriptions History (only for activated clients) */}
      {isActivated && <SubscriptionsSection subscriptions={client.subscriptions || []} />}

      {/* Progress Tracking (only for activated clients) */}
      {isActivated && (
        <>
          <ProgressEntryForm clientCode={client.code} />
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Progress History</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressHistoryTable progress={progress} />
            </CardContent>
          </Card>
          <ProgressCharts progress={progress} />
        </>
      )}

      {/* Dialogs */}
      <ActivateClientDialog
        open={activateDialogOpen}
        onOpenChange={setActivateDialogOpen}
        onConfirm={handleActivateConfirm}
        isLoading={activateClient.isPending}
      />

      <PauseClientDialog
        open={pauseDialogOpen}
        onOpenChange={setPauseDialogOpen}
        onConfirm={handlePauseConfirm}
        isLoading={pauseClient.isPending}
      />

      <RenewSubscriptionDialog
        open={renewDialogOpen}
        onOpenChange={setRenewDialogOpen}
        onConfirm={handleRenewConfirm}
        isLoading={renewSubscription.isPending}
      />

      <FollowUpPromptDialog
        open={followUpDialogOpen}
        onOpenChange={setFollowUpDialogOpen}
        onSubmit={handleFollowUpSubmit}
        isLoading={recordFollowUp.isPending}
        mode="manual"
      />
    </div>
  );
}
