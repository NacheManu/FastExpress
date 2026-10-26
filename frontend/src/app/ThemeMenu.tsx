import { useCallback, useId, useRef, useState } from 'react';
import { useTheme } from '../core/theme/ThemeContext';
import { SEED_COLORS, type ThemeMode } from '../core/theme/themePreferences';
import { cn } from '../ui/cn';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';
import { SegmentedButton, type SegmentedOption } from '../ui/SegmentedButton';
import { useDismiss } from '../ui/useDismiss';

const MODE_OPTIONS: readonly SegmentedOption<ThemeMode>[] = [
  { value: 'light', label: 'Claro', icon: 'light_mode' },
  { value: 'system', label: 'Auto', icon: 'brightness_auto' },
  { value: 'dark', label: 'Oscuro', icon: 'dark_mode' },
];

/** Personalización de Material You: color semilla y modo claro/oscuro. */
export function ThemeMenu() {
  const { seedColor, mode, setSeedColor, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), []);

  useDismiss(containerRef, open, close);

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        icon="palette"
        label="Personalizar tema"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      />

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Personalizar tema"
          className="absolute end-0 top-12 z-40 w-[min(22rem,calc(100vw-2rem))] animate-enter rounded-lg bg-surface-container-high p-5 shadow-elevation-2"
        >
          <p className="type-title-small text-on-surface">Color</p>
          <div role="radiogroup" aria-label="Color del tema" className="mt-3 flex flex-wrap gap-3">
            {SEED_COLORS.map((color) => {
              const selected = color.hex.toLowerCase() === seedColor.toLowerCase();
              return (
                <button
                  key={color.hex}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={color.name}
                  title={color.name}
                  onClick={() => setSeedColor(color.hex)}
                  style={{ backgroundColor: color.hex }}
                  className={cn(
                    'state-layer flex size-10 items-center justify-center rounded-full text-white',
                    'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-secondary',
                    selected && 'ring-2 ring-on-surface ring-offset-2 ring-offset-surface-container-high',
                  )}
                >
                  {selected && <Icon name="check" size={20} />}
                </button>
              );
            })}
          </div>

          <p className="type-title-small mt-5 text-on-surface">Modo</p>
          <SegmentedButton label="Modo de color" options={MODE_OPTIONS} value={mode} onChange={setMode} className="mt-3" />
        </div>
      )}
    </div>
  );
}
