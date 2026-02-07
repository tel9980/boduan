/**
 * UI状态管理 Hook
 * 管理主题、字体、表格密度等UI相关状态
 */
import { useState, useCallback } from 'react';
import { getSettings, updateSettings, toggleTheme } from '../utils/localStorage';

export function useUIState() {
  const settings = getSettings();
  
  // 主题
  const [theme, setThemeState] = useState<'light' | 'dark'>(settings.theme);
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>(settings.fontSize);
  const [tableDensity, setTableDensityState] = useState<'compact' | 'standard' | 'comfortable'>(settings.tableDensity);
  const [cacheExpiry, setCacheExpiryState] = useState<number>(settings.cacheExpiry);
  const [showSettings, setShowSettings] = useState(false);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    updateSettings({ theme: newTheme });
  }, []);

  const toggleThemeMode = useCallback(() => {
    const newTheme = toggleTheme();
    setThemeState(newTheme);
  }, []);

  const setFontSize = useCallback((size: 'small' | 'medium' | 'large') => {
    setFontSizeState(size);
    updateSettings({ fontSize: size });
  }, []);

  const setTableDensity = useCallback((density: 'compact' | 'standard' | 'comfortable') => {
    setTableDensityState(density);
    updateSettings({ tableDensity: density });
  }, []);

  const setCacheExpiry = useCallback((expiry: number) => {
    setCacheExpiryState(expiry);
    updateSettings({ cacheExpiry: expiry });
  }, []);

  return {
    theme,
    setTheme,
    toggleThemeMode,
    fontSize,
    setFontSize,
    tableDensity,
    setTableDensity,
    cacheExpiry,
    setCacheExpiry,
    showSettings,
    setShowSettings,
  };
}
