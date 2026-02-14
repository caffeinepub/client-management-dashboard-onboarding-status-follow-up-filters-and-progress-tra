import { useEffect, useState } from 'react';
import { useBackendReadiness } from './useBackendReadiness';

/**
 * Provides a stabilized connection state for UI gating.
 * Now relies on confirmed backend readiness (successful isReady() call)
 * rather than just actor availability timing.
 * Resets to connecting immediately when actor/identity changes.
 */
export function useStableActorConnection() {
  const { actor, isChecking, isReady } = useBackendReadiness();
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionReady, setConnectionReady] = useState(false);

  useEffect(() => {
    // If backend is not ready yet, immediately show connecting state
    if (isChecking || !isReady) {
      setIsConnecting(true);
      setConnectionReady(false);
      return;
    }

    // Backend readiness confirmed - add small stabilization delay to prevent flicker
    const stabilizationTimer = setTimeout(() => {
      setIsConnecting(false);
      setConnectionReady(true);
    }, 100);

    return () => clearTimeout(stabilizationTimer);
  }, [isChecking, isReady]);

  return {
    isConnecting,
    isReady: connectionReady,
    actor,
  };
}
