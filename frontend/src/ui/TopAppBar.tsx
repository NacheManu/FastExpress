import type { ReactNode } from 'react';
import { useScrolled } from '../core/hooks/useScrolled';
import { cn } from './cn';

interface TopAppBarProps {
  title: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Barra superior pequeña de M3: pasa a surface-container cuando el contenido se desplaza por debajo. */
export function TopAppBar({ title, leading, actions, className }: TopAppBarProps) {
  const scrolled = useScrolled();

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-16 items-center gap-1 px-1 transition-colors duration-200 ease-emphasized',
        scrolled ? 'bg-surface-container' : 'bg-surface',
        className,
      )}
    >
      {leading && <div className="flex items-center ps-3">{leading}</div>}
      <div className="type-title-large min-w-0 flex-1 truncate px-3">{title}</div>
      {actions && <div className="flex items-center gap-1 pe-1">{actions}</div>}
    </header>
  );
}
