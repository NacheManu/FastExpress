import { InvalidWeightError, WeightLimitExceededError } from '../errors.js';
import {
  PRICING_RULES,
  maxWeightKg,
  minWeightKg,
  type PricingRules,
  type WeightTier,
} from './pricing-rules.js';
import type { Shipment } from './shipment.js';

/** Desglose de la tarifa de un envío. Todos los importes van en centavos. */
export interface ShippingCostBreakdown {
  currency: PricingRules['currency'];
  baseFeeCents: number;
  weightTier: WeightTier;
  weightChargeCents: number;
  subtotalCents: number;
  discountPercent: number;
  discountCents: number;
  subtotalAfterDiscountCents: number;
  surchargePercent: number;
  surchargeCents: number;
  totalCents: number;
}

/**
 * Calcula la tarifa de un envío aplicando BR-01 a BR-04 en cadena:
 *
 *   subtotal               = tarifa base (BR-01) + peso × tarifa del tramo (BR-02)
 *   descuento              = subtotal × % según el tipo de cliente (BR-03)
 *   subtotal con descuento = subtotal − descuento
 *   recargo                = subtotal con descuento × % según el tipo de envío (BR-04)
 *   total                  = subtotal con descuento + recargo
 *
 * Es el orden que fija el marco teórico del proyecto: el factor final sobre el subtotal
 * es (1 − descuento) × (1 + recargo). Cada porcentaje se redondea al centavo más cercano.
 *
 * @throws InvalidWeightError si el peso no es válido.
 * @throws WeightLimitExceededError si el peso supera el máximo (BR-02).
 */
export function calculateShippingCost(
  shipment: Shipment,
  rules: PricingRules = PRICING_RULES,
): ShippingCostBreakdown {
  const weightCentiKg = toCentiKg(shipment.weightKg);
  const weightTier = findWeightTier(shipment.weightKg, weightCentiKg, rules);

  const weightChargeCents = Math.round((weightCentiKg * weightTier.ratePerKgCents) / 100);
  const subtotalCents = rules.baseFeeCents + weightChargeCents;

  const discountPercent = rules.customerDiscountPercent[shipment.customerType];
  const surchargePercent = rules.shippingSurchargePercent[shipment.shippingType];
  const discountCents = percentOf(subtotalCents, discountPercent);
  const subtotalAfterDiscountCents = subtotalCents - discountCents;
  const surchargeCents = percentOf(subtotalAfterDiscountCents, surchargePercent);

  return {
    currency: rules.currency,
    baseFeeCents: rules.baseFeeCents,
    weightTier,
    weightChargeCents,
    subtotalCents,
    discountPercent,
    discountCents,
    subtotalAfterDiscountCents,
    surchargePercent,
    surchargeCents,
    totalCents: subtotalAfterDiscountCents + surchargeCents,
  };
}

/** Convierte el peso a centésimas de kg, validando que sea finito y tenga como máximo 2 decimales. */
function toCentiKg(weightKg: number): number {
  if (!Number.isFinite(weightKg)) {
    throw new InvalidWeightError('El peso debe ser un número válido.');
  }

  const centiKg = Math.round(weightKg * 100);
  if (Math.abs(weightKg * 100 - centiKg) > 1e-6) {
    throw new InvalidWeightError('El peso admite como máximo 2 decimales.');
  }

  return centiKg;
}

function findWeightTier(weightKg: number, weightCentiKg: number, rules: PricingRules): WeightTier {
  const min = minWeightKg(rules);
  if (weightCentiKg < toCentiKg(min)) {
    throw new InvalidWeightError(`El peso mínimo es ${min.toFixed(2)} kg.`);
  }

  const max = maxWeightKg(rules);
  if (weightCentiKg > toCentiKg(max)) {
    throw new WeightLimitExceededError(weightKg, max);
  }

  const tier = rules.weightTiers.find(
    (candidate) =>
      weightCentiKg >= toCentiKg(candidate.minKg) && weightCentiKg <= toCentiKg(candidate.maxKg),
  );
  if (!tier) {
    throw new Error(`No hay un tramo de peso configurado para ${weightKg} kg.`);
  }

  return tier;
}

function percentOf(amountCents: number, percent: number): number {
  return Math.round((amountCents * percent) / 100);
}
