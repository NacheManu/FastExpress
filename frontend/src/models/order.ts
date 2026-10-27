import type { PriceBreakdown } from './pricing';
import type { Shipment } from './shipment';

export interface Order {
  id: string;
  customerName: string;
  /** Fecha ISO 8601. */
  createdAt: string;
  shipment: Shipment;
  currency: string;
  breakdown: PriceBreakdown;
}

export interface CreateOrderInput extends Shipment {
  customerName: string;
}

/** Número corto y legible de una orden a partir de su id: "3f2a9c1e-..." -> "#3F2A9C1E". */
export function formatOrderNumber(id: string): string {
  return `#${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}
