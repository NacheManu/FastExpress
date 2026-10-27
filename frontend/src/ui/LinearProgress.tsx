import { cn } from './cn';

/** Indicador de progreso lineal indeterminado de M3. */
export function LinearProgress({ label = 'Cargando', className }: { label?: string; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      className={cn('h-1 w-full overflow-hidden rounded-full bg-secondary-container', className)}
    >
      <div className="h-full w-2/5 animate-progress rounded-full bg-primary motion-reduce:animate-none" />
    </div>
  );
}
