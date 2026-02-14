import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActorReady } from './useActorReady';
import { useInternetIdentity } from './useInternetIdentity';
import type { FollowUpDay, OnboardingState, Time, UserProfile, ExtendedClient, ClientSummary, AppInitData } from '../backend';
import { isClientActivated, getClientStatus, EXPIRING_WINDOW_DAYS } from '../utils/status';
import { useMemo } from 'react';
import { timings } from '../utils/initialLoadTimings';

// Helper to get identity key for query scoping
function useIdentityKey() {
  const { identity } = useInternetIdentity();
  return identity?.getPrincipal().toString() || 'anonymous';
}

/**
 * Combined initial app data fetch - uses backend's getAppInitData for optimal startup.
 * Seeds both profile and client summaries caches from a single call.
 */
export function useGetAppInitData() {
  const { actor, isFetching: actorFetching, actorReady } = useActorReady();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useQuery<AppInitData>({
    queryKey: ['appInitData', identityKey],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      timings.start('app-init-data-fetch');
      const data = await actor.getAppInitData();
      timings.end('app-init-data-fetch');

      // Seed individual caches from combined response
      queryClient.setQueryData(['currentUserProfile', identityKey], data.userProfile);
      
      // Transform client summaries into the expected format
      const activated = data.clientSummaries.filter(c => c.activatedAt !== undefined);
      const half = data.clientSummaries.filter(c => c.onboardingState === 'half' && c.activatedAt === undefined);
      const full = data.clientSummaries.filter(c => c.onboardingState === 'full' && c.activatedAt === undefined);
      
      queryClient.setQueryData(['clientSummaries', identityKey], {
        activated,
        half,
        full,
      });

      timings.report();
      
      return data;
    },
    enabled: !!actor && !actorFetching && actorReady,
    staleTime: 60_000, // 1 minute - prevent refetch during initial navigation
    gcTime: 5 * 60_000, // 5 minutes
    retry: 1,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching, actorReady } = useActorReady();
  const identityKey = useIdentityKey();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile', identityKey],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      timings.start('profile-fetch');
      const profile = await actor.getCallerUserProfile();
      timings.end('profile-fetch');
      return profile;
    },
    enabled: !!actor && !actorFetching && actorReady,
    retry: 1,
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes
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
      queryClient.invalidateQueries({ queryKey: ['appInitData', identityKey] });
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
      
      timings.start('client-summaries-fetch');
      // Fetch both activated and non-activated summaries in parallel
      const [activated, nonActivated] = await Promise.all([
        actor.getActivatedClientSummaries(),
        actor.getNonActivatedClientSummaries(),
      ]);
      timings.end('client-summaries-fetch');
      
      return {
        activated,
        half: nonActivated.halfOnboardedClients,
        full: nonActivated.fullOnboardedClients,
      };
    },
    enabled: !!actor && !isFetching && actorReady,
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes
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
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes
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
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
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
 * Expiring clients are activated, currently active (not paused, not expired),
 * and have an end date within the next 10 days.
 */
export function useGetExpiringClients() {
  const { data: allSummaries, isLoading } = useGetAllClientSummaries();

  const expiringClients = useMemo(() => {
    if (!allSummaries) return [];
    
    // Compute expiring status client-side using 10-day window
    const now = BigInt(Date.now() * 1_000_000);
    const expiringWindowEnd = now + (BigInt(EXPIRING_WINDOW_DAYS) * 86_400_000_000_000n);
    
    return allSummaries.filter(client => {
      // Must be activated
      if (!isClientActivated(client)) return false;
      
      // Must have an end date
      const endDate = client.subscriptionSummary?.endDate;
      if (!endDate) return false;
      
      // Must be currently active (not paused, not expired)
      const status = getClientStatus(client);
      if (status !== 'active') return false;
      
      // End date must be within the expiring window (> now and <= now + 10 days)
      return endDate > now && endDate <= expiringWindowEnd;
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
    queryKey: ['clientProgress', clientCode?.toString(), identityKey],
    queryFn: async () => {
      if (!actor || !clientCode) return [];
      return actor.getClientProgress(clientCode);
    },
    enabled: !!actor && !isFetching && actorReady && clientCode !== null,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
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
      notes: string;
      onboardingState: OnboardingState;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createClient(
        params.name,
        params.mobileNumber,
        params.notes,
        params.onboardingState
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clients', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['appInitData', identityKey] });
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
      
      // Get the client to extract plan duration
      const client = await actor.getClientByCode(params.clientCode);
      if (!client) throw new Error('Client not found');
      
      // Use the first subscription's plan duration if it exists, otherwise default to 30 days
      const planDurationDays = client.subscriptions && client.subscriptions.length > 0
        ? client.subscriptions[0].planDurationDays
        : 30n;
      
      // Create the initial subscription
      await actor.createOrRenewSubscription(
        params.clientCode,
        planDurationDays,
        0n, // No extra days for initial activation
        params.startDate
      );
      
      // Set the follow-up day
      await actor.setFollowUpDay(params.clientCode, params.followUpDay);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientCode.toString(), identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clients', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['appInitData', identityKey] });
    },
  });
}

export function useRenewSubscription() {
  const { actor } = useActorReady();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      clientCode: bigint;
      planDurationDays: bigint;
      extraDays: bigint;
      startDate: Time;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createOrRenewSubscription(
        params.clientCode,
        params.planDurationDays,
        params.extraDays,
        params.startDate
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientCode.toString(), identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clients', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['appInitData', identityKey] });
    },
  });
}

export function useExpireMembershipImmediately() {
  const { actor } = useActorReady();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientCode: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.expireMembershipImmediately(clientCode);
    },
    onSuccess: (_data, clientCode) => {
      queryClient.invalidateQueries({ queryKey: ['client', clientCode.toString(), identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clients', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['appInitData', identityKey] });
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientProgress', variables.clientCode.toString(), identityKey] });
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientCode.toString(), identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clients', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['appInitData', identityKey] });
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
    onSuccess: (_data, clientCode) => {
      queryClient.invalidateQueries({ queryKey: ['client', clientCode.toString(), identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clients', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['appInitData', identityKey] });
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientCode.toString(), identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['clients', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['appInitData', identityKey] });
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientCode.toString(), identityKey] });
    },
  });
}

export function useGetFollowUpHistory(clientCode: bigint | null) {
  const { actor, isFetching, actorReady } = useActorReady();
  const identityKey = useIdentityKey();

  return useQuery({
    queryKey: ['followUpHistory', clientCode?.toString(), identityKey],
    queryFn: async () => {
      if (!actor || !clientCode) return [];
      return actor.getFollowUpHistory(clientCode);
    },
    enabled: !!actor && !isFetching && actorReady && clientCode !== null,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  });
}
