import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createColorTokens } from './dynamicScheme';
import { useTheme } from './ThemeContext';
import { DEFAULT_THEME, loadThemePreferences, saveThemePreferences } from './themePreferences';
import { ThemeProvider } from './ThemeProvider';

const STORAGE_KEY = 'fastexpress.theme';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('style');
  document.head.innerHTML = '<meta name="theme-color" content="#ffffff" />';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('themePreferences', () => {
  it('usa los valores por defecto si no hay nada guardado', () => {
    expect(loadThemePreferences()).toEqual(DEFAULT_THEME);
  });

  it('recupera una preferencia guardada válida', () => {
    saveThemePreferences({ seedColor: '#0B57D0', mode: 'dark' });

    expect(loadThemePreferences()).toEqual({ seedColor: '#0B57D0', mode: 'dark' });
  });

  it.each([
    ['JSON corrupto', '{no es json'],
    ['un texto', JSON.stringify('violeta')],
    ['un color inválido', JSON.stringify({ seedColor: 'azul', mode: 'dark' })],
    ['un modo desconocido', JSON.stringify({ seedColor: '#0B57D0', mode: 'sepia' })],
  ])('ignora %s y usa los valores por defecto', (_caso, stored) => {
    localStorage.setItem(STORAGE_KEY, stored);

    expect(loadThemePreferences()).toEqual(DEFAULT_THEME);
  });

  it('funciona sin almacenamiento disponible (modo privado)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });

    expect(loadThemePreferences()).toEqual(DEFAULT_THEME);
    expect(() => saveThemePreferences(DEFAULT_THEME)).not.toThrow();
  });
});

function ThemeProbe() {
  const theme = useTheme();
  return (
    <>
      <output>{`${theme.mode}|${theme.isDark}|${theme.seedColor}`}</output>
      <button onClick={() => theme.setMode('dark')}>Oscuro</button>
      <button onClick={() => theme.setSeedColor('#146C2E')}>Verde</button>
    </>
  );
}

describe('ThemeProvider', () => {
  it('aplica el esquema de color y guarda los cambios', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    const root = document.documentElement;

    expect(screen.getByRole('status')).toHaveTextContent('system|false|#6750A4');
    expect(root.style.getPropertyValue('--md-sys-color-primary')).toBe(createColorTokens('#6750A4', false).primary);
    expect(root.style.colorScheme).toBe('light');

    await user.click(screen.getByRole('button', { name: 'Oscuro' }));
    await user.click(screen.getByRole('button', { name: 'Verde' }));

    const tokens = createColorTokens('#146C2E', true);
    expect(screen.getByRole('status')).toHaveTextContent('dark|true|#146C2E');
    expect(root.style.colorScheme).toBe('dark');
    expect(root.style.getPropertyValue('--md-sys-color-primary')).toBe(tokens.primary);
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', tokens.surface);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toEqual({ seedColor: '#146C2E', mode: 'dark' });
  });

  it('en modo automático sigue la preferencia oscura del sistema', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    );

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('system|true|');
  });

  it('useTheme exige estar dentro de ThemeProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useTheme())).toThrow('useTheme debe usarse dentro de <ThemeProvider>.');
  });
});
