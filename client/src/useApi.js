import { useCallback, useEffect, useState } from 'react';
import { getJson } from './api.js';

export const useApi = (path) => {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  const load = useCallback(() => {
    let active = true;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    getJson(path)
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch((error) => active && setState({ data: null, error: error.message, loading: false }));
    return () => {
      active = false;
    };
  }, [path]);

  useEffect(() => load(), [load]);

  return { ...state, reload: load };
};
