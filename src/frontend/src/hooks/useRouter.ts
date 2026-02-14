import { useEffect, useState } from 'react';

export type Route = 'dashboard' | 'clients' | 'onboard' | string;

export function useRouter() {
  const [currentRoute, setCurrentRoute] = useState<Route>(() => {
    const hash = window.location.hash.slice(1) || 'dashboard';
    return hash;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'dashboard';
      setCurrentRoute(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route: string) => {
    window.location.hash = route;
  };

  const getClientCode = (): bigint | null => {
    if (currentRoute.startsWith('client/')) {
      const codeStr = currentRoute.split('/')[1];
      try {
        return BigInt(codeStr);
      } catch {
        return null;
      }
    }
    return null;
  };

  return { currentRoute, navigate, getClientCode };
}
