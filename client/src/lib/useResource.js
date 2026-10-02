import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { subscribeLive } from './live.js';

export const useResource = (path, { refreshOn = [] } = {}) => {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const pathRef = useRef(path);
  pathRef.current = path;

  const reload = useCallback(async () => {
    if (!pathRef.current) return;
    try {
      const data = await api.get(pathRef.current);
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((previous) => ({ ...previous, error: error.message, loading: false }));
    }
  }, []);

  useEffect(() => {
    if (!path) return;
    setState((previous) => ({ ...previous, loading: true }));
    reload();
  }, [path, reload]);

  const refreshKey = refreshOn.join('|');
  useEffect(() => {
    if (!refreshKey) return undefined;
    const prefixes = refreshKey.split('|');
    return subscribeLive((event) => {
      if (event.type === 'data.reset' || prefixes.some((prefix) => event.type.startsWith(prefix))) reload();
    });
  }, [refreshKey, reload]);

  return { ...state, reload, setData: (data) => setState((previous) => ({ ...previous, data })) };
};
