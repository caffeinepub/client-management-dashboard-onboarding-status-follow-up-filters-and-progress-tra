import { useEffect, useState } from 'react';
import { useActorReady } from './useActorReady';

/**
 * Provides a stabilized connection state for UI gating.
 * Introduces a minimum loading duration and debounce to avoid rapid toggling
 * when actor is created/invalidated (e.g., after login, refresh, or canister upgrade).
 */
export function useStableActorConnection() {
  const { actor, isFetching, actorReady } = useActorReady();
  const [isConnecting, setIsConnecting] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // If actor is not ready, immediately show connecting state
    if (!actor || isFetching || !actorReady) {
      setIsConnecting(true);
      setIsReady(false);
      return;
    }

    // Actor is ready - add a small stabilization delay to prevent flicker
    // This ensures transient actor invalidation windows don't cause rapid UI state flips
    const stabilizationTimer = setTimeout(() => {
      setIsConnecting(false);
      setIsReady(true);
    }, 100);

    return () => clearTimeout(stabilizationTimer);
  }, [actor, isFetching, actorReady]);

  return {
    isConnecting,
    isReady,
    actor,
  };
}
