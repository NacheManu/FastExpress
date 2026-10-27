import type { CustomerType, Shipment, ShippingType } from './shipment';

export interface WeightTier {
  minKg: number;
  maxKg: number;
  ratePerKg: number;
}

/** Desglose de la tarifa calculada por el backend (importes en la moneda indicada). */
export interface PriceBreakdown {
  baseFee: number;
  weightTier: WeightTier;
  weightCharge: number;
  subtotal: number;
  discountPercent: number;
  discount: number;
  surchargePercent: number;
  surcharge: number;
  total: number;
}

export interface Quote {
  shipment: Shipment;
  currency: string;
  breakdown: PriceBreakdown;
}

/** Reglas de tarifa vigentes (BR-01 a BR-04) tal como las expone el backend. */
export interface PricingRules {
  currency: string;
  baseFee: number;
  minWeightKg: number;
  maxWeightKg: number;
  weightTiers: WeightTier[];
  customerDiscountPercent: Record<CustomerType, number>;
  shippingSurchargePercent: Record<ShippingType, number>;
}
