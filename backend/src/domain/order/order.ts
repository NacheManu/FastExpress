import type { ShippingCostBreakdown } from '../pricing/calculate-shipping-cost.js';
import type { Shipment } from '../pricing/shipment.js';

/** Orden de envío creada con la tarifa calculada en el momento de su registro. */
export interface Order {
  readonly id: string;
  readonly customerName: string;
  readonly shipment: Shipment;
  readonly pricing: ShippingCostBreakdown;
  readonly createdAt: Date;
}
