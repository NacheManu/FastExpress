import { describe, expect, it } from 'vitest';
import { applyColorTokens, createColorTokens } from './dynamicScheme';

describe('createColorTokens', () => {
  it('genera todos los roles de color como hexadecimales', () => {
    const tokens = createColorTokens('#6750A4', false);

    expect(Object.keys(tokens)).toContain('surface-container-highest');
    for (const value of Object.values(tokens)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('produce superficies oscuras en modo oscuro', () => {
    const light = createColorTokens('#6750A4', false);
    const dark = createColorTokens('#6750A4', true);

    expect(light.surface).not.toBe(dark.surface);
    expect(luminance(dark.surface)).toBeLessThan(luminance(light.surface));
  });

  it('aplica los roles como variables CSS', () => {
    const tokens = createColorTokens('#0B57D0', true);

    applyColorTokens(tokens, true);

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--md-sys-color-primary')).toBe(tokens.primary);
    expect(root.style.colorScheme).toBe('dark');
  });
});

function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  return ((value >> 16) & 255) + ((value >> 8) & 255) + (value & 255);
}
