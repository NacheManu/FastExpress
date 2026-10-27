import { useRef, type KeyboardEvent } from 'react';
import { cn } from './cn';
import { Icon } from './Icon';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

interface SegmentedButtonProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Nombre accesible del grupo. */
  label: string;
  disabled?: boolean;
  className?: string;
}

/** Botones segmentados de M3 con selección única (patrón radiogroup, navegable con flechas). */
export function SegmentedButton<T extends string>({
  options,
  value,
  onChange,
  label,
  disabled = false,
  className,
}: SegmentedButtonProps<T>) {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) {
      return;
    }
    event.preventDefault();
    const current = options.findIndex((option) => option.value === value);
    const next = (current + step + options.length) % options.length;
    const nextOption = options[next];
    if (nextOption) {
      onChange(nextOption.value);
      buttonsRef.current[next]?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onKeyDown={handleKeyDown}
      className={cn('flex h-10 w-full overflow-hidden rounded-full border border-outline', className)}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const icon = selected ? 'check' : option.icon;
        return (
          <button
            key={option.value}
            ref={(element) => {
              buttonsRef.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              '@container state-layer flex min-w-0 flex-1 items-center justify-center gap-2 px-3 type-label-large',
              'transition-colors duration-200 ease-emphasized focus-visible:outline-none',
              'focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-secondary',
              'disabled:cursor-not-allowed disabled:text-on-surface/38',
              index > 0 && 'border-s border-outline',
              selected ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface',
            )}
          >
            {/* En segmentos estrechos se omite el icono para que quepa la etiqueta. */}
            {icon && (
              <span className="flex @max-[7.5rem]:hidden">
                <Icon name={icon} size={18} />
              </span>
            )}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
