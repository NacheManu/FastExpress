import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { applyColorTokens, createColorTokens } from './dynamicScheme';
import { ThemeContext, type ThemeContextValue } from './ThemeContext';
import { loadThemePreferences, saveThemePreferences, type ThemeMode } from './themePreferences';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(loadThemePreferences);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const isDark = preferences.mode === 'dark' || (preferences.mode === 'system' && prefersDark);

  useLayoutEffect(() => {
    applyColorTokens(createColorTokens(preferences.seedColor, isDark), isDark);
  }, [preferences.seedColor, isDark]);

  useEffect(() => {
    saveThemePreferences(preferences);
  }, [preferences]);

  const setSeedColor = useCallback((seedColor: string) => {
    setPreferences((current) => ({ ...current, seedColor }));
  }, []);

  const setMode = useCallback((mode: ThemeMode) => {
    setPreferences((current) => ({ ...current, mode }));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ ...preferences, isDark, setSeedColor, setMode }),
    [preferences, isDark, setSeedColor, setMode],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
