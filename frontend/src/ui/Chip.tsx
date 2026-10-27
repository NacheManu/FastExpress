import { cn } from './cn';
import { Icon } from './Icon';

/** Chip informativo de M3 (no interactivo). Hereda el color del texto de su contenedor. */
export function Chip({ icon, label, className }: { icon?: string; label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-sm border border-current/25 type-label-large',
        icon ? 'ps-2 pe-3' : 'px-3',
        className,
      )}
    >
      {icon && <Icon name={icon} size={18} />}
      {label}
    </span>
  );
}
