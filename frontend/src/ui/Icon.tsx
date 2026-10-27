import { cn } from './cn';

interface IconProps {
  /** Nombre del icono de Material Symbols (p. ej. "local_shipping"). */
  name: string;
  filled?: boolean;
  size?: number;
  className?: string;
}

export function Icon({ name, filled = false, size = 24, className }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('icon shrink-0 select-none', className)}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'opsz' ${Math.min(Math.max(size, 20), 48)}`,
      }}
    >
      {name}
    </span>
  );
}
