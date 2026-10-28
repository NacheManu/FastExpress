import type { Order } from '../domain/order/order.js';
import type { ShippingCostBreakdown } from '../domain/pricing/calculate-shipping-cost.js';
import { maxWeightKg, minWeightKg, type PricingRules } from '../domain/pricing/pricing-rules.js';
import type { Shipment } from '../domain/pricing/shipment.js';

/** Convierte centavos a un importe decimal en la moneda de la tarifa (500 -> 5). */
const toAmount = (cents: number): number => cents / 100;

export function presentBreakdown(breakdown: ShippingCostBreakdown) {
  return {
    baseFee: toAmount(breakdown.baseFeeCents),
    weightTier: {
      minKg: breakdown.weightTier.minKg,
      maxKg: breakdown.weightTier.maxKg,
      ratePerKg: toAmount(breakdown.weightTier.ratePerKgCents),
    },
    weightCharge: toAmount(breakdown.weightChargeCents),
    subtotal: toAmount(breakdown.subtotalCents),
    discountPercent: breakdown.discountPercent,
    discount: toAmount(breakdown.discountCents),
    subtotalAfterDiscount: toAmount(breakdown.subtotalAfterDiscountCents),
    surchargePercent: breakdown.surchargePercent,
    surcharge: toAmount(breakdown.surchargeCents),
    total: toAmount(breakdown.totalCents),
  };
}

export function presentQuote(shipment: Shipment, breakdown: ShippingCostBreakdown) {
  return {
    shipment,
    currency: breakdown.currency,
    breakdown: presentBreakdown(breakdown),
  };
}

export function presentOrder(order: Order) {
  return {
    id: order.id,
    customerName: order.customerName,
    createdAt: order.createdAt.toISOString(),
    shipment: order.shipment,
    currency: order.pricing.currency,
    breakdown: presentBreakdown(order.pricing),
  };
}

export function presentPricingRules(rules: PricingRules) {
  return {
    currency: rules.currency,
    baseFee: toAmount(rules.baseFeeCents),
    minWeightKg: minWeightKg(rules),
    maxWeightKg: maxWeightKg(rules),
    weightTiers: rules.weightTiers.map((tier) => ({
      minKg: tier.minKg,
      maxKg: tier.maxKg,
      ratePerKg: toAmount(tier.ratePerKgCents),
    })),
    customerDiscountPercent: rules.customerDiscountPercent,
    shippingSurchargePercent: rules.shippingSurchargePercent,
  };
}
