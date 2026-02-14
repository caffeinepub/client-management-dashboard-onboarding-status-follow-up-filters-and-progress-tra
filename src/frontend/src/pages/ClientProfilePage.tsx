import { Suspense, lazy, useState } from 'react';
import { useRouter } from '../hooks/useRouter';
import { useGetClient, useGetClientProgress, useActivateClient, usePauseClient } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Phone, Calendar, FileText, Download } from 'lucide-react';
import { ClientStatusBadge } from '../components/clients/ClientStatusBadge';
import { ActivateClientDialog } from '../components/clients/ActivateClientDialog';
import { PauseClientDialog } from '../components/clients/PauseClientDialog';
import { ProgressEntryForm } from '../components/progress/ProgressEntryForm';
import { ProgressHistoryTable } from '../components/progress/ProgressHistoryTable';
import { FollowUpSection } from '../components/clients/FollowUpSection';
import { getDisplayStatus, isClientActivated } from '../utils/status';
import { formatDate } from '../utils/format';
import { formatClientCode } from '../utils/clientCode';
import { toast } from 'sonner';
import { normalizeError } from '../utils/errors';
import type { FollowUpDay } from '../backend';

// Lazy load heavy components
const ProgressCharts = lazy(() => 
  import('../components/progress/ProgressCharts').then(m => ({ default: m.ProgressCharts }))
);
const ExportClientsExcelDialog = lazy(() => 
  import('../components/clients/ExportClientsExcelDialog').then(m => ({ default: m.ExportClientsExcelDialog }))
);

export function ClientProfilePage() {
  const { getClientCode, navigate } = useRouter();
  const clientCode = getClientCode();
  const { data: client, isLoading: clientLoading } = useGetClient(clientCode);
  const { data: progress = [], isLoading: progressLoading } = useGetClientProgress(clientCode);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  
  const activateClient = useActivateClient();
  const pauseClient = usePauseClient();

  const handleActivate = async (startDate: Date, followUpDay: FollowUpDay) => {
    if (!client) return;
    
    try {
      const startTimestamp = BigInt(startDate.getTime() * 1_000_000);
      await activateClient.mutateAsync({
        clientCode: client.code,
        startDate: startTimestamp,
        followUpDay,
      });
      toast.success('Client activated successfully!');
      setShowActivateDialog(false);
    } catch (error) {
      toast.error(normalizeError(error));
      console.error('Activation error:', error);
    }
  };

  const handlePause = async (durationDays: number, reason: string) => {
    if (!client) return;
    
    try {
      await pauseClient.mutateAsync({
        clientCode: client.code,
        pauseDurationDays: durationDays,
        pauseReason: reason,
      });
      toast.success('Client paused successfully!');
      setShowPauseDialog(false);
    } catch (error) {
      toast.error(normalizeError(error));
      console.error('Pause error:', error);
    }
  };

  if (clientLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading client...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Client not found</h2>
        <p className="text-muted-foreground mb-4">The client you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('clients')}>Back to Clients</Button>
      </div>
    );
  }

  const displayStatus = getDisplayStatus(client);
  const activated = isClientActivated(client);

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
          <p className="text-muted-foreground mt-1">{formatClientCode(client.code.toString())}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowExportDialog(true)}
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
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
            {client.notes && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">{client.notes}</span>
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
            {client.startDate && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="font-medium">{formatDate(client.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Date:</span>
                  <span className="font-medium">{client.endDate ? formatDate(client.endDate) : 'N/A'}</span>
                </div>
              </>
            )}
            {!activated && (
              <div className="pt-2">
                <Button onClick={() => setShowActivateDialog(true)} className="w-full">
                  Activate Client
                </Button>
              </div>
            )}
            {activated && client.status === 'active' && (
              <div className="pt-2">
                <Button onClick={() => setShowPauseDialog(true)} variant="outline" className="w-full">
                  Pause Client
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {activated && (
        <>
          <FollowUpSection client={client} />

          <Tabs defaultValue="progress" className="space-y-4">
            <TabsList>
              <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
            </TabsList>

            <TabsContent value="progress" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Record New Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProgressEntryForm clientCode={client.code} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Progress History</CardTitle>
                </CardHeader>
                <CardContent>
                  {progressLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : (
                    <ProgressHistoryTable progress={progress} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts">
              <Card>
                <CardHeader>
                  <CardTitle>Progress Charts</CardTitle>
                </CardHeader>
                <CardContent>
                  {progressLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : (
                    <Suspense fallback={
                      <div className="flex justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    }>
                      <ProgressCharts progress={progress} />
                    </Suspense>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {showExportDialog && (
        <Suspense fallback={null}>
          <ExportClientsExcelDialog
            clients={[client]}
            open={showExportDialog}
            onOpenChange={setShowExportDialog}
          />
        </Suspense>
      )}

      <ActivateClientDialog
        open={showActivateDialog}
        onOpenChange={setShowActivateDialog}
        onConfirm={handleActivate}
        isLoading={activateClient.isPending}
      />

      <PauseClientDialog
        open={showPauseDialog}
        onOpenChange={setShowPauseDialog}
        onConfirm={handlePause}
        isLoading={pauseClient.isPending}
      />
    </div>
  );
}
