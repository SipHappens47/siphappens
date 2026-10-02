import { useEffect, useRef, useState } from 'react';

export type LoadError = 'request' | 'auth' | 'not-found' | null;

// Each result belongs to one account/resource scope and one request generation.
export function useLoadSection<T>(scope: string | null, allowNotFound = false) {
  const current = useRef({ scope, generation: 0, epoch: 0 });
  if (current.current.scope !== scope) current.current = { scope, generation: current.current.generation + 1, epoch: current.current.epoch + 1 };
  const epoch = current.current.epoch;
  const [state, setState] = useState<{ scope: string | null; epoch: number; data?: T; loading: boolean; error: LoadError }>({ scope, epoch, loading: true, error: null });
  useEffect(() => () => { current.current.generation++; }, []);
  const visible = state.epoch === epoch ? state : { scope, epoch, loading: true, error: null, data: undefined };

  const load = async (request: () => Promise<T>) => {
    if (current.current.epoch !== epoch) return;
    const generation = ++current.current.generation;
    const isCurrent = () => current.current.epoch === epoch && current.current.generation === generation;
    if (!scope) {
      setState({ scope, epoch, loading: false, error: 'auth' });
      return;
    }
    setState(prev => ({ scope, epoch, data: prev.epoch === epoch ? prev.data : undefined, loading: true, error: null }));
    try {
      const data = await request();
      if (isCurrent()) setState({ scope, epoch, data, loading: false, error: null });
    } catch (error: any) {
      if (!isCurrent()) return;
      const status = error?.response?.status;
      const kind: LoadError = status === 401 ? 'auth' : allowNotFound && status === 404 ? 'not-found' : 'request';
      setState(prev => ({ scope, epoch, data: kind === 'request' && prev.epoch === epoch ? prev.data : undefined, loading: false, error: kind }));
    }
  };
  const setData = (update: T | ((previous: T) => T)) => {
    if (current.current.epoch !== epoch) return;
    setState(prev => prev.epoch !== epoch || prev.data === undefined ? prev : {
      ...prev, data: typeof update === 'function' ? (update as (previous: T) => T)(prev.data) : update,
    });
  };
  return { ...visible, load, setData };
}
