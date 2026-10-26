export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemePreferences {
  seedColor: string;
  mode: ThemeMode;
}

export const SEED_COLORS = [
  { name: 'Violeta', hex: '#6750A4' },
  { name: 'Azul', hex: '#0B57D0' },
  { name: 'Verde', hex: '#146C2E' },
  { name: 'Ámbar', hex: '#B45309' },
  { name: 'Rosa', hex: '#B4245E' },
] as const;

export const DEFAULT_THEME: ThemePreferences = { seedColor: SEED_COLORS[0].hex, mode: 'system' };

const STORAGE_KEY = 'fastexpress.theme';
const MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

export function loadThemePreferences(): ThemePreferences {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (isThemePreferences(stored)) {
      return stored;
    }
  } catch {
    // Almacenamiento no disponible o con datos corruptos: se usan los valores por defecto.
  }
  return DEFAULT_THEME;
}

export function saveThemePreferences(preferences: ThemePreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Sin almacenamiento (modo privado, cuota llena...): la preferencia dura solo esta sesión.
  }
}

function isThemePreferences(value: unknown): value is ThemePreferences {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { seedColor, mode } = value as Record<string, unknown>;
  return (
    typeof seedColor === 'string' &&
    /^#[0-9a-f]{6}$/i.test(seedColor) &&
    MODES.includes(mode as ThemeMode)
  );
}
