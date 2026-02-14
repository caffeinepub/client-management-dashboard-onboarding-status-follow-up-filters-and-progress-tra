import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { FollowUpDay, OnboardingState, Time, UserProfile } from '../backend';
import { isClientActivated } from '../utils/status';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetAllClients() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      if (!actor) return [];
      
      // Fetch all three categories
      const [allClients, halfClients, fullClients] = await Promise.all([
        actor.getAllClients(),
        actor.filterClientsByOnboardingState('half' as OnboardingState),
        actor.filterClientsByOnboardingState('full' as OnboardingState),
      ]);
      
      // Combine and deduplicate by client code
      const clientMap = new Map();
      
      // Add all activated clients first
      allClients.forEach(client => {
        clientMap.set(client.code.toString(), client);
      });
      
      // Add non-activated half onboarded clients
      halfClients.forEach(client => {
        if (!clientMap.has(client.code.toString())) {
          clientMap.set(client.code.toString(), client);
        }
      });
      
      // Add non-activated full onboarded clients
      fullClients.forEach(client => {
        if (!clientMap.has(client.code.toString())) {
          clientMap.set(client.code.toString(), client);
        }
      });
      
      return Array.from(clientMap.values());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetClient(clientCode: bigint | null) {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['client', clientCode?.toString()],
    queryFn: async () => {
      if (!actor || !clientCode) return null;
      
      const allClients = queryClient.getQueryData<any[]>(['clients']);
      if (allClients) {
        const cached = allClients.find((c) => c.code === clientCode);
        if (cached) return cached;
      }

      const [allClientsData, halfClients, fullClients] = await Promise.all([
        actor.getAllClients(),
        actor.filterClientsByOnboardingState('half' as OnboardingState),
        actor.filterClientsByOnboardingState('full' as OnboardingState),
      ]);
      
      const clientMap = new Map();
      allClientsData.forEach(client => clientMap.set(client.code.toString(), client));
      halfClients.forEach(client => {
        if (!clientMap.has(client.code.toString())) {
          clientMap.set(client.code.toString(), client);
        }
      });
      fullClients.forEach(client => {
        if (!clientMap.has(client.code.toString())) {
          clientMap.set(client.code.toString(), client);
        }
      });
      
      const combined = Array.from(clientMap.values());
      return combined.find((c) => c.code === clientCode) || null;
    },
    enabled: !!actor && !isFetching && clientCode !== null,
  });
}

export function useGetClientsByFollowUpDay(day: FollowUpDay | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['clients', 'followUpDay', day],
    queryFn: async () => {
      if (!actor || !day) return [];
      const clients = await actor.getClientsByFollowUpDay(day);
      return clients.filter(client => isClientActivated(client) && client.status === 'active');
    },
    enabled: !!actor && !isFetching && day !== null,
  });
}

export function useGetExpiringClients() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['clients', 'expiring'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpiringClients();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetClientProgress(clientCode: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['progress', clientCode?.toString()],
    queryFn: async () => {
      if (!actor || !clientCode) return [];
      return actor.getClientProgress(clientCode);
    },
    enabled: !!actor && !isFetching && clientCode !== null,
  });
}

export function useCreateClient() {
  const { actor } = useActor();
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
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useAddProgress() {
  const { actor } = useActor();
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
      queryClient.invalidateQueries({ queryKey: ['progress', variables.clientCode.toString()] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientCode.toString()] });
    },
  });
}

export function usePauseClient() {
  const { actor } = useActor();
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
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientCode.toString()] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useResumeClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientCode: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.resumeClient(clientCode);
    },
    onSuccess: (_, clientCode) => {
      queryClient.invalidateQueries({ queryKey: ['client', clientCode.toString()] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateOnboardingState() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { clientCode: bigint; state: OnboardingState }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateOnboardingState(params.clientCode, params.state);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientCode.toString()] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useActivateClient() {
  const { actor } = useActor();
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
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientCode.toString()] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useRecordFollowUp() {
  const { actor } = useActor();
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
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientCode.toString()] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
