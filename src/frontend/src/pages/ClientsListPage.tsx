import { useState, useMemo, Suspense, lazy } from 'react';
import { useGetAllClientSummaries, useGetExpiringClients, usePrepareClientsForExport } from '../hooks/useQueries';
import { useRouter } from '../hooks/useRouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Calendar, Search, Users, Download, Loader2 } from 'lucide-react';
import { ClientStatusBadge } from '../components/clients/ClientStatusBadge';
import { ClientsStatusFilterButton } from '../components/clients/ClientsStatusFilterButton';
import { getClientStatus, getDisplayStatus, isClientActivated, type ClientStatus } from '../utils/status';
import { formatDate } from '../utils/format';
import { formatClientCode, matchesClientCodeQuery } from '../utils/clientCode';
import type { OnboardingState, ExtendedClient } from '../backend';
import { OnboardingState as OnboardingStateEnum } from '../backend';
import { toast } from 'sonner';

// Lazy load export dialog
const ExportClientsExcelDialog = lazy(() => 
  import('../components/clients/ExportClientsExcelDialog').then(m => ({ default: m.ExportClientsExcelDialog }))
);

type FilterType = 'all' | 'active' | 'paused' | 'expired' | 'expiring' | 'half' | 'full';

export function ClientsListPage() {
  const { data: allSummaries, isLoading } = useGetAllClientSummaries();
  const { data: expiringClients } = useGetExpiringClients();
  const { navigate } = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportClients, setExportClients] = useState<ExtendedClient[] | null>(null);
  
  const prepareExport = usePrepareClientsForExport();

  const filteredSummaries = useMemo(() => {
    if (!allSummaries) return [];

    let filtered = allSummaries;

    // Apply status/onboarding filter
    if (filter !== 'all') {
      filtered = filtered.filter((client) => {
        const status = getClientStatus(client);
        const activated = isClientActivated(client);
        
        if (filter === 'active') {
          return activated && status !== 'paused' && status !== 'expired';
        }
        
        if (filter === 'paused') {
          return status === 'paused';
        }
        
        if (filter === 'expiring') {
          return expiringClients?.some((ec) => ec.code === client.code);
        }
        
        if (filter === 'half' || filter === 'full') {
          const onboardingState: OnboardingState = filter === 'half' ? OnboardingStateEnum.half : OnboardingStateEnum.full;
          return client.onboardingState === onboardingState && !activated;
        }
        
        return status === filter;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          matchesClientCodeQuery(client.code, query) ||
          client.mobileNumber.includes(query)
      );
    }

    return filtered;
  }, [allSummaries, expiringClients, filter, searchQuery]);

  const getFilterCount = (filterType: FilterType): number => {
    if (!allSummaries) return 0;
    if (filterType === 'all') return allSummaries.length;
    if (filterType === 'expiring') return expiringClients?.length || 0;
    
    if (filterType === 'active') {
      return allSummaries.filter((c) => {
        const status = getClientStatus(c);
        return isClientActivated(c) && status !== 'paused' && status !== 'expired';
      }).length;
    }
    
    if (filterType === 'paused') {
      return allSummaries.filter((c) => getClientStatus(c) === 'paused').length;
    }
    
    if (filterType === 'half') {
      return allSummaries.filter((c) => c.onboardingState === OnboardingStateEnum.half && !isClientActivated(c)).length;
    }
    
    if (filterType === 'full') {
      return allSummaries.filter((c) => c.onboardingState === OnboardingStateEnum.full && !isClientActivated(c)).length;
    }
    
    return allSummaries.filter((c) => getClientStatus(c) === filterType).length;
  };

  const handleExport = async () => {
    if (filteredSummaries.length === 0) {
      toast.error('No clients to export');
      return;
    }

    try {
      const clientCodes = filteredSummaries.map((c) => c.code);
      const fullClients = await prepareExport.mutateAsync(clientCodes);
      setExportClients(fullClients);
      setShowExportDialog(true);
    } catch (error) {
      console.error('Failed to prepare clients for export:', error);
      toast.error('Failed to prepare export data');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your fitness coaching clients</p>
        </div>
        <Button onClick={() => navigate('onboard')}>
          <Users className="mr-2 h-4 w-4" />
          Onboard New Client
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, or mobile number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <ClientsStatusFilterButton
            currentFilter={filter}
            onFilterChange={setFilter}
            getFilterCount={getFilterCount}
          />
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={prepareExport.isPending || filteredSummaries.length === 0}
          >
            {prepareExport.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>

      {filteredSummaries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No clients found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery.trim()
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by onboarding your first client'}
            </p>
            {!searchQuery.trim() && (
              <Button onClick={() => navigate('onboard')}>
                <Users className="mr-2 h-4 w-4" />
                Onboard New Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSummaries.map((client) => {
            const displayStatus = getDisplayStatus(client);
            const endDate = client.subscriptionSummary?.endDate;

            return (
              <Card
                key={client.code.toString()}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => navigate(`client/${client.code.toString()}`)}
              >
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{client.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatClientCode(client.code.toString())}
                        </p>
                      </div>
                      <ClientStatusBadge status={displayStatus} />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{client.mobileNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {endDate ? `Ends: ${formatDate(endDate)}` : 'Ends: —'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showExportDialog && exportClients && (
        <Suspense fallback={null}>
          <ExportClientsExcelDialog
            clients={exportClients}
            open={showExportDialog}
            onOpenChange={setShowExportDialog}
          />
        </Suspense>
      )}
    </div>
  );
}
