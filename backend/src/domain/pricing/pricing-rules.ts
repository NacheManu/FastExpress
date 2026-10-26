import type { CustomerType, ShippingType } from './shipment.js';

/**
 * Tramo de peso (BR-02). Los límites son inclusivos y se expresan en kg con 2 decimales.
 * Todo el peso del envío se cobra a la tarifa del tramo en el que cae.
 */
export interface WeightTier {
  minKg: number;
  maxKg: number;
  ratePerKgCents: number;
}

/**
 * Configuración de tarifas. Los importes van en centavos para evitar errores
 * de redondeo de coma flotante; los porcentajes son enteros (10 = 10 %).
 */
export interface PricingRules {
  currency: 'USD';
  baseFeeCents: number;
  weightTiers: readonly WeightTier[];
  customerDiscountPercent: Readonly<Record<CustomerType, number>>;
  shippingSurchargePercent: Readonly<Record<ShippingType, number>>;
}

export const PRICING_RULES: PricingRules = {
  currency: 'USD',
  // BR-01: toda orden tiene un costo base de $5.00.
  baseFeeCents: 500,
  // BR-02: $2.00/kg hasta 5 kg, $4.00/kg hasta 20 kg; más de 20 kg se rechaza.
  weightTiers: [
    { minKg: 0.01, maxKg: 5, ratePerKgCents: 200 },
    { minKg: 5.01, maxKg: 20, ratePerKgCents: 400 },
  ],
  // BR-03: descuento por tipo de cliente.
  customerDiscountPercent: {
    NUEVO: 0,
    FRECUENTE: 10,
    VIP: 20,
  },
  // BR-04: recargo por tipo de envío, sobre el subtotal.
  shippingSurchargePercent: {
    ESTANDAR: 0,
    EXPRESS: 25,
  },
};

export function minWeightKg(rules: PricingRules): number {
  return Math.min(...rules.weightTiers.map((tier) => tier.minKg));
}

export function maxWeightKg(rules: PricingRules): number {
  return Math.max(...rules.weightTiers.map((tier) => tier.maxKg));
}
