import { useState, useMemo } from 'react';
import { useGetAllClients, useGetExpiringClients } from '../hooks/useQueries';
import { useRouter } from '../hooks/useRouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Phone, Calendar, Search, Users } from 'lucide-react';
import { ClientStatusBadge } from '../components/clients/ClientStatusBadge';
import { getClientStatus, getDisplayStatus, isClientActivated, type ClientStatus } from '../utils/status';
import { formatDate } from '../utils/format';
import { formatClientCode, matchesClientCodeQuery } from '../utils/clientCode';
import type { OnboardingState } from '../backend';
import { OnboardingState as OnboardingStateEnum } from '../backend';

type FilterType = 'all' | 'active' | 'paused' | 'expired' | 'expiring' | 'half' | 'full';

export function ClientsListPage() {
  const { data: allClients, isLoading } = useGetAllClients();
  const { data: expiringClients } = useGetExpiringClients();
  const { navigate } = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = useMemo(() => {
    if (!allClients) return [];

    let filtered = allClients;

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
  }, [allClients, expiringClients, filter, searchQuery]);

  const getFilterCount = (filterType: FilterType): number => {
    if (!allClients) return 0;
    if (filterType === 'all') return allClients.length;
    if (filterType === 'expiring') return expiringClients?.length || 0;
    
    if (filterType === 'active') {
      return allClients.filter((c) => {
        const status = getClientStatus(c);
        return isClientActivated(c) && status !== 'paused' && status !== 'expired';
      }).length;
    }
    
    if (filterType === 'paused') {
      return allClients.filter((c) => getClientStatus(c) === 'paused').length;
    }
    
    if (filterType === 'half' || filterType === 'full') {
      const onboardingState: OnboardingState = filterType === 'half' ? OnboardingStateEnum.half : OnboardingStateEnum.full;
      return allClients.filter((c) => {
        return c.onboardingState === onboardingState && !isClientActivated(c);
      }).length;
    }
    return allClients.filter((c) => getClientStatus(c) === filterType).length;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground mt-1">Manage and track all your clients</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => navigate('onboard')}>
          <Users className="mr-2 h-4 w-4" />
          Onboard Client
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">
            All
            <span className="ml-1.5 text-xs">({getFilterCount('all')})</span>
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            <span className="ml-1.5 text-xs">({getFilterCount('active')})</span>
          </TabsTrigger>
          <TabsTrigger value="half">
            Half
            <span className="ml-1.5 text-xs">({getFilterCount('half')})</span>
          </TabsTrigger>
          <TabsTrigger value="full">
            Full
            <span className="ml-1.5 text-xs">({getFilterCount('full')})</span>
          </TabsTrigger>
          <TabsTrigger value="paused">
            Paused
            <span className="ml-1.5 text-xs">({getFilterCount('paused')})</span>
          </TabsTrigger>
          <TabsTrigger value="expiring">
            Expiring
            <span className="ml-1.5 text-xs">({getFilterCount('expiring')})</span>
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired
            <span className="ml-1.5 text-xs">({getFilterCount('expired')})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-muted-foreground">Loading clients...</p>
          </div>
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
            const displayStatus = getDisplayStatus(client);
            const activated = isClientActivated(client);
            return (
              <Card
                key={client.code.toString()}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`client/${client.code.toString()}`)}
              >
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{client.name}</h3>
                        <p className="text-sm text-muted-foreground">Code: {formatClientCode(client.code)}</p>
                      </div>
                      <ClientStatusBadge status={displayStatus} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{client.mobileNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {activated && client.endDate ? (
                          <span>Ends: {formatDate(client.endDate)}</span>
                        ) : (
                          <span className="text-muted-foreground">Not activated yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <Users className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">No clients found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Get started by onboarding your first client'}
                </p>
              </div>
              {!searchQuery && (
                <Button onClick={() => navigate('onboard')} className="mt-4">
                  Onboard Client
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
