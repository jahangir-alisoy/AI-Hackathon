import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { api } from './api.js';
import { useResource } from './useResource.js';

const SettingsContext = createContext(null);

const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
  else delete root.dataset.theme;
  try {
    localStorage.setItem('standin-theme', theme);
  } catch {
    return;
  }
};

export const SettingsProvider = ({ children }) => {
  const resource = useResource('/settings', { refreshOn: ['settings.'] });

  useEffect(() => {
    if (resource.data?.theme) applyTheme(resource.data.theme);
  }, [resource.data?.theme]);

  const update = useCallback(async (patch) => {
    const saved = await api.patch('/settings', patch);
    resource.setData({ ...resource.data, ...saved });
    return saved;
  }, [resource]);

  const value = useMemo(() => ({
    settings: resource.data,
    timeZone: resource.data?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    update,
    reload: resource.reload,
  }), [resource.data, resource.reload, update]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => useContext(SettingsContext);
