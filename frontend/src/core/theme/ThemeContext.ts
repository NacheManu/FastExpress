import { createContext, useContext } from 'react';
import type { ThemeMode, ThemePreferences } from './themePreferences';

export interface ThemeContextValue extends ThemePreferences {
  isDark: boolean;
  setSeedColor: (seedColor: string) => void;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de <ThemeProvider>.');
  }
  return context;
}
