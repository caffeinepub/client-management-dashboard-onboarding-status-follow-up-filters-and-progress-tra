import { useEffect, useState } from 'react';
import { useActor } from './useActor';

/**
 * Wrapper hook that provides an "actorReady" signal.
 * This signal becomes true on the next tick after the actor becomes available,
 * preventing queries from mounting during actor-change invalidation windows.
 */
export function useActorReady() {
  const { actor, isFetching } = useActor();
  const [actorReady, setActorReady] = useState(false);

  useEffect(() => {
    if (actor && !isFetching) {
      // Small delay to allow invalidation to complete before queries mount
      const timer = setTimeout(() => {
        setActorReady(true);
      }, 50); // Increased from 0 to 50ms for better stability
      return () => clearTimeout(timer);
    } else {
      setActorReady(false);
    }
  }, [actor, isFetching]);

  return {
    actor,
    isFetching,
    actorReady,
  };
}
