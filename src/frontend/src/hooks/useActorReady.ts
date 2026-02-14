import { useEffect, useState } from 'react';
import { useActor } from './useActor';

/**
 * Wrapper hook that provides an "actorReady" signal.
 * This signal becomes true on the next tick after the actor becomes available,
 * preventing queries from mounting during actor-change invalidation/refetch windows.
 */
export function useActorReady() {
  const { actor, isFetching } = useActor();
  const [actorReady, setActorReady] = useState(false);

  useEffect(() => {
    if (actor && !isFetching) {
      // Delay actorReady signal to next tick to allow invalidation to complete
      const timer = setTimeout(() => {
        setActorReady(true);
      }, 0);
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
