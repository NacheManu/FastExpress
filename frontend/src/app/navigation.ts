import type { NavDestination } from '../ui/Navigation';

export const NAV_DESTINATIONS: readonly NavDestination[] = [
  { to: '/', label: 'Cotizar', icon: 'calculate', end: true },
  { to: '/ordenes', label: 'Órdenes', icon: 'inventory_2' },
];
