import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { cn } from './cn';
import { Icon } from './Icon';

export interface NavDestination {
  to: string;
  label: string;
  icon: string;
  /** Solo activa la ruta exacta (para la raíz "/"). */
  end?: boolean;
}

interface NavigationProps {
  destinations: readonly NavDestination[];
  className?: string;
}

function Destination({ destination, layout }: { destination: NavDestination; layout: 'rail' | 'bar' }) {
  return (
    <NavLink
      to={destination.to}
      end={destination.end}
      className={cn(
        'group flex flex-col items-center gap-1 outline-none',
        layout === 'rail' ? 'w-20 py-1' : 'h-full w-full justify-center',
      )}
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'state-layer flex h-8 items-center justify-center rounded-full transition-colors duration-200 ease-emphasized',
              'group-hover:before:opacity-8 group-focus-visible:outline-3 group-focus-visible:outline-secondary',
              layout === 'rail' ? 'w-14' : 'w-16',
              isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant',
            )}
          >
            <Icon name={destination.icon} filled={isActive} />
          </span>
          <span className={cn('type-label-medium', isActive ? 'text-on-surface' : 'text-on-surface-variant')}>
            {destination.label}
          </span>
        </>
      )}
    </NavLink>
  );
}

/** Riel de navegación de M3, para ventanas medianas y expandidas. */
export function NavigationRail({ destinations, header, className }: NavigationProps & { header?: ReactNode }) {
  return (
    <nav aria-label="Navegación principal" className={cn('w-20 flex-col items-center gap-8 py-4', className)}>
      {header}
      <ul className="flex flex-col items-center gap-3">
        {destinations.map((destination) => (
          <li key={destination.to}>
            <Destination destination={destination} layout="rail" />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Barra de navegación inferior de M3, para ventanas compactas (móvil). */
export function NavigationBar({ destinations, className }: NavigationProps) {
  return (
    <nav
      aria-label="Navegación principal"
      className={cn('bg-surface-container pb-[env(safe-area-inset-bottom)]', className)}
    >
      <ul className="flex h-20">
        {destinations.map((destination) => (
          <li key={destination.to} className="flex-1">
            <Destination destination={destination} layout="bar" />
          </li>
        ))}
      </ul>
    </nav>
  );
}
