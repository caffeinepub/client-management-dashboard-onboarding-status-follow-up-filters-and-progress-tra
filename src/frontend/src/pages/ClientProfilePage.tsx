import { useState, useEffect } from 'react';
import { useRouter } from '../hooks/useRouter';
import { useGetClient, useGetClientProgress, usePauseClient, useResumeClient, useUpdateOnboardingState, useActivateClient, useRecordFollowUp } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Phone, Calendar, StickyNote, Pause, Play, CheckCircle, Clock } from 'lucide-react';
import { ClientStatusBadge } from '../components/clients/ClientStatusBadge';
import { ActivateClientDialog } from '../components/clients/ActivateClientDialog';
import { PauseClientDialog } from '../components/clients/PauseClientDialog';
import { FollowUpSection } from '../components/clients/FollowUpSection';
import { FollowUpPromptDialog } from '../components/clients/FollowUpPromptDialog';
import { ProgressEntryForm } from '../components/progress/ProgressEntryForm';
import { ProgressHistoryTable } from '../components/progress/ProgressHistoryTable';
import { ProgressCharts } from '../components/progress/ProgressCharts';
import { getClientStatus, getDisplayStatus, isClientActivated } from '../utils/status';
import { formatDate, formatDateTime } from '../utils/format';
import { formatClientCode } from '../utils/clientCode';
import { normalizeError } from '../utils/errors';
import { isFollowUpDue } from '../utils/followUp';
import { toast } from 'sonner';
import { OnboardingState, FollowUpDay } from '../backend';

export function ClientProfilePage() {
  const { navigate, getClientCode } = useRouter();
  const clientCode = getClientCode();
  const { data: client, isLoading: clientLoading } = useGetClient(clientCode);
  const { data: progress, isLoading: progressLoading } = useGetClientProgress(clientCode);
  const pauseClient = usePauseClient();
  const resumeClient = useResumeClient();
  const updateOnboardingState = useUpdateOnboardingState();
  const activateClient = useActivateClient();
  const recordFollowUp = useRecordFollowUp();
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showFollowUpPrompt, setShowFollowUpPrompt] = useState(false);

  // Check if follow-up prompt should be shown
  useEffect(() => {
    if (client && !clientLoading) {
      const shouldPrompt = isFollowUpDue(client);
      setShowFollowUpPrompt(shouldPrompt);
    }
  }, [client, clientLoading]);

  if (!clientCode) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Invalid client code</p>
        <Button onClick={() => navigate('clients')} className="mt-4">
          Back to Clients
        </Button>
      </div>
    );
  }

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading client profile...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Client not found</p>
        <Button onClick={() => navigate('clients')} className="mt-4">
          Back to Clients
        </Button>
      </div>
    );
  }

  const status = getClientStatus(client);
  const displayStatus = getDisplayStatus(client);
  const isPaused = status === 'paused';
  const isActivated = isClientActivated(client);
  const canActivate = client.onboardingState === OnboardingState.full && !isActivated && status !== 'paused' && status !== 'expired';

  const handlePauseConfirm = async (durationDays: number, reason: string) => {
    try {
      await pauseClient.mutateAsync({ clientCode: client.code, pauseDurationDays: durationDays, pauseReason: reason });
      toast.success('Client paused successfully');
      setShowPauseDialog(false);
    } catch (error) {
      toast.error(normalizeError(error));
      console.error('Pause error:', error);
    }
  };

  const handleResume = async () => {
    try {
      await resumeClient.mutateAsync(client.code);
      toast.success('Client resumed successfully');
    } catch (error) {
      toast.error(normalizeError(error));
      console.error('Resume error:', error);
    }
  };

  const handleToggleOnboarding = async () => {
    const newState: OnboardingState = client.onboardingState === OnboardingState.half ? OnboardingState.full : OnboardingState.half;
    try {
      await updateOnboardingState.mutateAsync({ clientCode: client.code, state: newState });
      toast.success(`Onboarding state updated to ${newState === OnboardingState.half ? 'Half' : 'Full'} Onboard`);
    } catch (error) {
      toast.error(normalizeError(error));
      console.error('Update onboarding state error:', error);
    }
  };

  const handleActivateConfirm = async (startDate: Date, followUpDay: FollowUpDay) => {
    try {
      const startDateTime = BigInt(startDate.getTime() * 1_000_000); // Convert to nanoseconds
      await activateClient.mutateAsync({ clientCode: client.code, startDate: startDateTime, followUpDay });
      toast.success('Client activated successfully');
      setShowActivateDialog(false);
    } catch (error) {
      toast.error(normalizeError(error));
      console.error('Activate client error:', error);
    }
  };

  const handleFollowUpSubmit = async (done: boolean, notes: string) => {
    if (!client.followUpDay) return;

    try {
      await recordFollowUp.mutateAsync({
        clientCode: client.code,
        followUpDay: client.followUpDay,
        done,
        notes,
      });
      toast.success(`Follow-up recorded as ${done ? 'done' : 'not done'}`);
      setShowFollowUpPrompt(false);
    } catch (error) {
      toast.error(normalizeError(error));
      console.error('Record follow-up error:', error);
    }
  };

  const handleManualMarkDone = async () => {
    if (!client.followUpDay) return;

    try {
      await recordFollowUp.mutateAsync({
        clientCode: client.code,
        followUpDay: client.followUpDay,
        done: true,
        notes: '',
      });
      toast.success('Follow-up marked as done');
      // Close the automatic prompt if it's open
      setShowFollowUpPrompt(false);
    } catch (error) {
      toast.error(normalizeError(error));
      console.error('Manual mark done error:', error);
    }
  };

  const followUpDayLabel = client.followUpDay 
    ? client.followUpDay.charAt(0).toUpperCase() + client.followUpDay.slice(1)
    : 'Not set';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('clients')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <ClientStatusBadge status={displayStatus} />
          </div>
          <p className="text-muted-foreground mt-1">Client Code: {formatClientCode(client.code)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.mobileNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Follow-up: {followUpDayLabel}</span>
            </div>
            {client.notes && (
              <div className="flex items-start gap-2 pt-2">
                <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{client.planDurationDays.toString()} days</span>
            </div>
            {isActivated ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="font-medium">{formatDate(client.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Date:</span>
                  <span className="font-medium">{formatDate(client.endDate)}</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground pt-2">
                Plan not activated yet. Activate to set start and end dates.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Follow-up Section */}
      {isActivated && client.followUpDay && (
        <FollowUpSection 
          client={client} 
          onMarkDone={handleManualMarkDone}
          isMarkingDone={recordFollowUp.isPending}
        />
      )}

      {client.pauseEntries && client.pauseEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Pause History
            </CardTitle>
            <CardDescription>Record of all pause periods for this client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {client.pauseEntries.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {formatDateTime(entry.timestamp)}
                      </span>
                      {entry.resumed ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                          Resumed
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Duration: {entry.durationDays.toString()} {Number(entry.durationDays) === 1 ? 'day' : 'days'}
                    </p>
                    {entry.reason && (
                      <p className="text-sm text-muted-foreground italic">
                        Reason: {entry.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Manage client status and onboarding</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {isActivated ? (
            <>
              {isPaused ? (
                <Button onClick={handleResume} disabled={resumeClient.isPending}>
                  {resumeClient.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Resuming...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Resume Client
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={() => setShowPauseDialog(true)} disabled={pauseClient.isPending} variant="outline">
                  <Pause className="mr-2 h-4 w-4" />
                  Pause Client
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                onClick={handleToggleOnboarding}
                disabled={updateOnboardingState.isPending}
                variant="outline"
              >
                {updateOnboardingState.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                    Updating...
                  </>
                ) : (
                  <>
                    Switch to {client.onboardingState === OnboardingState.half ? 'Full' : 'Half'} Onboard
                  </>
                )}
              </Button>
              {canActivate && (
                <Button
                  onClick={() => setShowActivateDialog(true)}
                  disabled={activateClient.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate Client
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="entry" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entry">New Entry</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="entry">
          <ProgressEntryForm clientCode={client.code} />
        </TabsContent>

        <TabsContent value="history">
          <ProgressHistoryTable progress={progress || []} />
        </TabsContent>

        <TabsContent value="charts">
          <ProgressCharts progress={progress || []} />
        </TabsContent>
      </Tabs>

      <ActivateClientDialog
        open={showActivateDialog}
        onOpenChange={setShowActivateDialog}
        onConfirm={handleActivateConfirm}
        isLoading={activateClient.isPending}
      />

      <PauseClientDialog
        open={showPauseDialog}
        onOpenChange={setShowPauseDialog}
        onConfirm={handlePauseConfirm}
        isLoading={pauseClient.isPending}
      />

      <FollowUpPromptDialog
        open={showFollowUpPrompt}
        onOpenChange={setShowFollowUpPrompt}
        onSubmit={handleFollowUpSubmit}
        isLoading={recordFollowUp.isPending}
      />
    </div>
  );
}
