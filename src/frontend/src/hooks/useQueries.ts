import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActorReady } from './useActorReady';
import { useInternetIdentity } from './useInternetIdentity';
import type { FollowUpDay, OnboardingState, Time, UserProfile, ExtendedClient, ClientSummary } from '../backend';
import { isClientActivated } from '../utils/status';
import { useMemo } from 'react';

// Helper to get identity key for query scoping
function useIdentityKey() {
  const { identity } = useInternetIdentity();
  return identity?.getPrincipal().toString() || 'anonymous';
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching, actorReady } = useActorReady();
  const identityKey = useIdentityKey();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile', identityKey],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && actorReady,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActorReady();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile', identityKey] });
    },
  });
}

/**
 * Fetch lightweight client summaries for list views and dashboard.
 * This is the primary query for initial page loads.
 */
export function useGetClientSummaries() {
  const { actor, isFetching, actorReady } = useActorReady();
  const identityKey = useIdentityKey();

  return useQuery({
    queryKey: ['clientSummaries', identityKey],
    queryFn: async () => {
      if (!actor) return { activated: [], half: [], full: [] };
      
      // Fetch both activated and non-activated summaries in parallel
      const [activated, nonActivated] = await Promise.all([
        actor.getActivatedClientSummaries(),
        actor.getNonActivatedClientSummaries(),
      ]);
      
      return {
        activated,
        half: nonActivated.halfOnboardedClients,
        full: nonActivated.fullOnboardedClients,
      };
    },
    enabled: !!actor && !isFetching && actorReady,
  });
}

/**
 * Derive all client summaries as a flat array.
 */
export function useGetAllClientSummaries() {
  const { data, isLoading } = useGetClientSummaries();

  const allSummaries = useMemo(() => {
    if (!data) return [];
    return [...data.activated, ...data.half, ...data.full];
  }, [data]);

  return {
    data: allSummaries,
    isLoading,
  };
}

/**
 * Legacy hook for full client data - now only used when full details are needed.
 * Prefer useGetClientSummaries for list views.
 */
export function useGetAllClients() {
  const { actor, isFetching, actorReady } = useActorReady();
  const identityKey = useIdentityKey();

  return useQuery({
    queryKey: ['clients', identityKey],
    queryFn: async () => {
      if (!actor) return [];
      
      // Single backend call to get all clients with full details
      const result = await actor.getAllClientsAndNonActivatedClients();
      
      // Combine all three arrays into one
      return [
        ...result.activatedClients,
        ...result.halfOnboardedClients,
        ...result.fullOnboardedClients,
      ];
    },
    enabled: !!actor && !isFetching && actorReady,
  });
}

/**
 * Fetch full client details for a specific client by code.
 */
export function useGetClient(clientCode: bigint | null) {
  const { actor, isFetching, actorReady } = useActorReady();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['client', clientCode?.toString(), identityKey],
    queryFn: async () => {
      if (!actor || !clientCode) return null;
      
      // First, check if we have the client in the cached full clients list
      const allClients = queryClient.getQueryData<ExtendedClient[]>(['clients', identityKey]);
      if (allClients) {
        const cached = allClients.find((c) => c.code === clientCode);
        if (cached) return cached;
      }

      // If not in cache, fetch single client by code
      return actor.getClientByCode(clientCode);
    },
    enabled: !!actor && !isFetching && actorReady && clientCode !== null,
  });
}

/**
 * Mutation to prepare full client data for export.
 * Fetches full ExtendedClient records for a given set of client codes.
 */
export function usePrepareClientsForExport() {
  const { actor } = useActorReady();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientCodes: bigint[]) => {
      if (!actor) throw new Error('Actor not available');
      
      // Check cache first
      const cachedClients = queryClient.getQueryData<ExtendedClient[]>(['clients', identityKey]);
      if (cachedClients) {
        const allCached = clientCodes.every(code => 
          cachedClients.some(c => c.code === code)
        );
        if (allCached) {
          return cachedClients.filter(c => clientCodes.some(code => code === c.code));
        }
      }

      // Fetch full data if not cached
      const result = await actor.getAllClientsAndNonActivatedClients();
      const allClients = [
        ...result.activatedClients,
        ...result.halfOnboardedClients,
        ...result.fullOnboardedClients,
      ];
      
      // Update cache
      queryClient.setQueryData(['clients', identityKey], allClients);
      
      // Return filtered clients
      return allClients.filter(c => clientCodes.some(code => code === c.code));
    },
  });
}

/**
 * Derive clients by follow-up day from cached summary data.
 */
export function useGetClientsByFollowUpDay(day: FollowUpDay | null) {
  const { data: allSummaries, isLoading } = useGetAllClientSummaries();

  const filteredClients = useMemo(() => {
    if (!allSummaries || !day) return [];
    
    // Filter client-side from cached summary data
    return allSummaries.filter(client => 
      isClientActivated(client) && 
      client.status === 'active' && 
      client.followUpDay === day
    );
  }, [allSummaries, day]);

  return {
    data: filteredClients,
    isLoading,
  };
}

/**
 * Derive expiring clients from cached summary data.
 */
export function useGetExpiringClients() {
  const { data: allSummaries, isLoading } = useGetAllClientSummaries();

  const expiringClients = useMemo(() => {
    if (!allSummaries) return [];
    
    // Compute expiring status client-side
    const threeDaysFromNow = BigInt(Date.now() * 1_000_000) + (3n * 86_400_000_000_000n);
    const now = BigInt(Date.now() * 1_000_000);
    
    return allSummaries.filter(client => {
      if (!client.endDate) return false;
      const endDate = client.endDate;
      return endDate > now && endDate <= threeDaysFromNow;
    });
  }, [allSummaries]);

  return {
    data: expiringClients,
    isLoading,
  };
}

export function useGetClientProgress(clientCode: bigint | null) {
  const { actor, isFetching, actorReady } = useActorReady();
  const identityKey = useIdentityKey();

  return useQuery({
    queryKey: ['progress', clientCode?.toString(), identityKey],
    queryFn: async () => {
      if (!actor || !clientCode) return [];
      return actor.getClientProgress(clientCode);
    },
    enabled: !!actor && !isFetching && actorReady && clientCode !== null,
  });
}

export function useCreateClient() {
  const { actor } = useActorReady();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      mobileNumber: string;
      planDurationDays: bigint;
      notes: string;
      initialOnboardingState: OnboardingState;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createClient(
        params.name,
        params.mobileNumber,
        params.planDurationDays,
        params.notes,
        params.initialOnboardingState
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clients', identityKey] });
    },
  });
}

export function useAddProgress() {
  const { actor } = useActorReady();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      clientCode: bigint;
      weightKg: number;
      neckInch: number;
      chestInch: number;
      waistInch: number;
      hipsInch: number;
      thighInch: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addProgress(
        params.clientCode,
        params.weightKg,
        params.neckInch,
        params.chestInch,
        params.waistInch,
        params.hipsInch,
        params.thighInch
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progress', variables.clientCode.toString(), identityKey] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientCode.toString(), identityKey] });
    },
  });
}

export function usePauseClient() {
  const { actor } = useActorReady();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      clientCode: bigint;
      pauseDurationDays: number;
      pauseReason: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.pauseClient(
        params.clientCode,
        BigInt(params.pauseDurationDays),
        params.pauseReason
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientCode.toString(), identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clients', identityKey] });
    },
  });
}

export function useResumeClient() {
  const { actor } = useActorReady();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientCode: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.resumeClient(clientCode);
    },
    onSuccess: (_, clientCode) => {
      queryClient.invalidateQueries({ queryKey: ['client', clientCode.toString(), identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clients', identityKey] });
    },
  });
}

export function useUpdateOnboardingState() {
  const { actor } = useActorReady();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { clientCode: bigint; state: OnboardingState }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateOnboardingState(params.clientCode, params.state);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientCode.toString(), identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clients', identityKey] });
    },
  });
}

export function useActivateClient() {
  const { actor } = useActorReady();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      clientCode: bigint;
      startDate: Time;
      followUpDay: FollowUpDay;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.activateClient(params.clientCode, params.startDate, params.followUpDay);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientCode.toString(), identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clients', identityKey] });
    },
  });
}

export function useRecordFollowUp() {
  const { actor } = useActorReady();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      clientCode: bigint;
      followUpDay: FollowUpDay;
      done: boolean;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordFollowUp(
        params.clientCode,
        params.followUpDay,
        params.done,
        params.notes
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientCode.toString(), identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clients', identityKey] });
    },
  });
}
