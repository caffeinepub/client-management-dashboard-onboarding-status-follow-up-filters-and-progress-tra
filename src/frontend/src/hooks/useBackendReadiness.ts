import { useEffect, useState, useRef } from 'react';
import { useActorReady } from './useActorReady';
import { timings } from '../utils/initialLoadTimings';

/**
 * Polls the backend readiness endpoint until it succeeds.
 * Resets immediately when actor or identity changes.
 * Uses bounded exponential backoff for polling during unavailability.
 */
export function useBackendReadiness() {
  const { actor, isFetching: actorFetching, actorReady } = useActorReady();
  const [isChecking, setIsChecking] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  // Use refs to track retry state without triggering effect restarts
  const retryCountRef = useRef(0);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const actorIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Generate a stable actor ID for tracking
    const currentActorId = actor ? `${Date.now()}-${Math.random()}` : null;
    
    // Reset readiness state immediately when actor changes
    if (actorIdRef.current !== currentActorId) {
      actorIdRef.current = currentActorId;
      setIsChecking(true);
      setIsReady(false);
      retryCountRef.current = 0;
      isPollingRef.current = false;
      
      // Clear any existing timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    }

    // If actor is not available yet, stay in checking state
    if (!actor || actorFetching || !actorReady) {
      return;
    }

    // Prevent multiple concurrent polling loops
    if (isPollingRef.current) {
      return;
    }

    let isMounted = true;
    isPollingRef.current = true;

    // Start timing for debug panel
    if (timings.isDebugEnabled()) {
      timings.start('backend-readiness-polling');
    }

    const checkReadiness = async () => {
      if (!isMounted || !actor) return;

      try {
        // Call the backend readiness endpoint
        await actor.isReady();
        
        if (isMounted) {
          setIsReady(true);
          setIsChecking(false);
          retryCountRef.current = 0;
          isPollingRef.current = false;
          
          // End timing for debug panel
          if (timings.isDebugEnabled()) {
            timings.end('backend-readiness-polling');
          }
        }
      } catch (error) {
        // Backend not ready yet - schedule retry with bounded exponential backoff
        if (isMounted) {
          // Cap retry count at 10 to prevent overflow
          const cappedRetryCount = Math.min(retryCountRef.current, 10);
          // Exponential backoff: 500ms * 1.5^n, capped at 5 seconds
          const delay = Math.min(500 * Math.pow(1.5, cappedRetryCount), 5000);
          retryCountRef.current += 1;
          
          timeoutIdRef.current = setTimeout(() => {
            timeoutIdRef.current = null;
            checkReadiness();
          }, delay);
        }
      }
    };

    // Start checking immediately
    checkReadiness();

    return () => {
      isMounted = false;
      isPollingRef.current = false;
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [actor, actorFetching, actorReady]); // Removed retryCount from dependencies

  return {
    isChecking,
    isReady,
    actor,
  };
}
