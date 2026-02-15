import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBackendReadiness } from './useBackendReadiness';
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
 * Now gated on confirmed backend readiness.
 */
export function useGetAppInitData() {
  const { actor, isReady } = useBackendReadiness();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useQuery<AppInitData>({
    queryKey: ['appInitData', identityKey],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      if (timings.isDebugEnabled()) {
        timings.start('app-init-data-fetch');
      }
      
      const data = await actor.getAppInitData();
      
      if (timings.isDebugEnabled()) {
        timings.end('app-init-data-fetch');
        timings.report();
      }

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
      
      return data;
    },
    enabled: !!actor && isReady,
    staleTime: 60_000, // 1 minute - prevent refetch during initial navigation
    gcTime: 5 * 60_000, // 5 minutes
    retry: 1,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isReady } = useBackendReadiness();
  const identityKey = useIdentityKey();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile', identityKey],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return await actor.getCallerUserProfile();
    },
    enabled: !!actor && isReady,
    retry: 1,
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes
  });

  return {
    ...query,
    isLoading: !isReady || query.isLoading,
    isFetched: isReady && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useBackendReadiness();
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
export function useGetAllClientSummaries() {
  const { actor, isReady } = useBackendReadiness();
  const identityKey = useIdentityKey();

  return useQuery<ClientSummary[]>({
    queryKey: ['clientSummaries', identityKey],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const data = await actor.getAppInitData();
      return data.clientSummaries;
    },
    enabled: !!actor && isReady,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    select: (data) => {
      // Return all summaries (activated and non-activated)
      return data;
    },
  });
}

export function useGetActivatedClientSummaries() {
  const { actor, isReady } = useBackendReadiness();
  const identityKey = useIdentityKey();

  return useQuery<ClientSummary[]>({
    queryKey: ['clientSummaries', identityKey],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const data = await actor.getAppInitData();
      return data.clientSummaries;
    },
    enabled: !!actor && isReady,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    select: (data) => {
      return data.filter(c => c.activatedAt !== undefined);
    },
  });
}

export function useGetNonActivatedClientSummaries() {
  const { actor, isReady } = useBackendReadiness();
  const identityKey = useIdentityKey();

  return useQuery<{ half: ClientSummary[]; full: ClientSummary[] }>({
    queryKey: ['clientSummaries', identityKey],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const data = await actor.getAppInitData();
      
      const half = data.clientSummaries.filter(c => c.onboardingState === 'half' && c.activatedAt === undefined);
      const full = data.clientSummaries.filter(c => c.onboardingState === 'full' && c.activatedAt === undefined);
      
      return { half, full };
    },
    enabled: !!actor && isReady,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useCreateClient() {
  const { actor } = useBackendReadiness();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      mobileNumber: string;
      notes: string;
      onboardingState: OnboardingState;
      planDurationDays: bigint;
      extraDays: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createClient(
        params.name,
        params.mobileNumber,
        params.notes,
        params.onboardingState,
        params.planDurationDays,
        params.extraDays
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['appInitData', identityKey] });
    },
  });
}

export function useGetClientByCode(clientCode: bigint | null) {
  const { actor, isReady } = useBackendReadiness();
  const identityKey = useIdentityKey();

  return useQuery<ExtendedClient | null>({
    queryKey: ['client', identityKey, clientCode?.toString()],
    queryFn: async () => {
      if (!actor || clientCode === null) return null;
      return actor.getClientByCode(clientCode);
    },
    enabled: !!actor && isReady && clientCode !== null,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useGetExpiringClients() {
  const { actor, isReady } = useBackendReadiness();
  const identityKey = useIdentityKey();

  return useQuery<ExtendedClient[]>({
    queryKey: ['expiringClients', identityKey],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getExpiringClients();
    },
    enabled: !!actor && isReady,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useGetClientProgress(clientCode: bigint | null) {
  const { actor, isReady } = useBackendReadiness();
  const identityKey = useIdentityKey();

  return useQuery({
    queryKey: ['clientProgress', identityKey, clientCode?.toString()],
    queryFn: async () => {
      if (!actor || clientCode === null) return [];
      return actor.getClientProgress(clientCode);
    },
    enabled: !!actor && isReady && clientCode !== null,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useAddProgress() {
  const { actor } = useBackendReadiness();
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
      queryClient.invalidateQueries({ queryKey: ['clientProgress', identityKey, variables.clientCode.toString()] });
      queryClient.invalidateQueries({ queryKey: ['client', identityKey, variables.clientCode.toString()] });
    },
  });
}

export function useActivateClient() {
  const { actor } = useBackendReadiness();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      clientCode: bigint;
      planDurationDays: bigint;
      extraDays: bigint;
      startDate: Time;
      followUpDay: FollowUpDay;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.createOrRenewSubscription(
        params.clientCode,
        params.planDurationDays,
        params.extraDays,
        params.startDate
      );
      await actor.setFollowUpDay(params.clientCode, params.followUpDay);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', identityKey, variables.clientCode.toString()] });
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['appInitData', identityKey] });
    },
  });
}

export function usePauseClient() {
  const { actor } = useBackendReadiness();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { clientCode: bigint; durationDays: bigint; reason: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.pauseClient(params.clientCode, params.durationDays, params.reason);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', identityKey, variables.clientCode.toString()] });
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['appInitData', identityKey] });
    },
  });
}

export function useResumeClient() {
  const { actor } = useBackendReadiness();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientCode: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.resumeClient(clientCode);
    },
    onSuccess: (_, clientCode) => {
      queryClient.invalidateQueries({ queryKey: ['client', identityKey, clientCode.toString()] });
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['appInitData', identityKey] });
    },
  });
}

export function useRenewSubscription() {
  const { actor } = useBackendReadiness();
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', identityKey, variables.clientCode.toString()] });
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['appInitData', identityKey] });
    },
  });
}

export function useExpireMembership() {
  const { actor } = useBackendReadiness();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientCode: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.expireMembershipImmediately(clientCode);
    },
    onSuccess: (_, clientCode) => {
      queryClient.invalidateQueries({ queryKey: ['client', identityKey, clientCode.toString()] });
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['appInitData', identityKey] });
    },
  });
}

export function useRecordFollowUp() {
  const { actor } = useBackendReadiness();
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
      return actor.recordFollowUp(params.clientCode, params.followUpDay, params.done, params.notes);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', identityKey, variables.clientCode.toString()] });
    },
  });
}

export function useConvertToFullOnboarding() {
  const { actor } = useBackendReadiness();
  const identityKey = useIdentityKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientCode: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.convertToFullOnboarding(clientCode);
    },
    onSuccess: (_, clientCode) => {
      queryClient.invalidateQueries({ queryKey: ['client', identityKey, clientCode.toString()] });
      queryClient.invalidateQueries({ queryKey: ['clientSummaries', identityKey] });
      queryClient.invalidateQueries({ queryKey: ['appInitData', identityKey] });
    },
  });
}

/**
 * Prepare clients for export by fetching full ExtendedClient data for given codes.
 */
export function usePrepareClientsForExport() {
  const { actor } = useBackendReadiness();

  return useMutation({
    mutationFn: async (clientCodes: bigint[]): Promise<ExtendedClient[]> => {
      if (!actor) throw new Error('Actor not available');
      
      const clients = await Promise.all(
        clientCodes.map(code => actor.getClientByCode(code))
      );
      
      return clients.filter((c): c is ExtendedClient => c !== null);
    },
  });
}

/**
 * Dashboard metrics computed from client summaries
 */
export function useDashboardMetrics() {
  const { data: allSummaries, isLoading } = useGetAllClientSummaries();
  const { data: expiringClients } = useGetExpiringClients();

  return useMemo(() => {
    if (!allSummaries) {
      return {
        total: 0,
        active: 0,
        paused: 0,
        expiring: 0,
        halfOnboarded: 0,
        fullOnboarded: 0,
        isLoading,
      };
    }

    const activated = allSummaries.filter(c => isClientActivated(c));
    const active = activated.filter(c => getClientStatus(c) !== 'paused' && getClientStatus(c) !== 'expired');
    const paused = activated.filter(c => getClientStatus(c) === 'paused');
    const halfOnboarded = allSummaries.filter(c => c.onboardingState === 'half' && !isClientActivated(c));
    const fullOnboarded = allSummaries.filter(c => c.onboardingState === 'full' && !isClientActivated(c));

    return {
      total: allSummaries.length,
      active: active.length,
      paused: paused.length,
      expiring: expiringClients?.length || 0,
      halfOnboarded: halfOnboarded.length,
      fullOnboarded: fullOnboarded.length,
      isLoading,
    };
  }, [allSummaries, expiringClients, isLoading]);
}
