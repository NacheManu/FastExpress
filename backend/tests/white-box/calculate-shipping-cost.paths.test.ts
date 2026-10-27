import { describe, expect, it } from 'vitest';
import { InvalidWeightError, WeightLimitExceededError } from '../../src/domain/errors.js';
import { calculateShippingCost } from '../../src/domain/pricing/calculate-shipping-cost.js';
import { PRICING_RULES, type PricingRules } from '../../src/domain/pricing/pricing-rules.js';
import type { Shipment } from '../../src/domain/pricing/shipment.js';

/**
 * Caja blanca — cobertura de caminos de calculateShippingCost (incluye toCentiKg y
 * findWeightTier). Nodos del grafo de flujo de control (CFG):
 *
 *   1 inicio          2 D1 ¿peso no finito?      3 error (no numérico)
 *   4 D2 ¿>2 decimales?                          5 error (decimales)
 *   6 D3 ¿peso < mínimo?                         7 error (mínimo)
 *   8 D4 ¿peso > máximo?                         9 error (límite excedido)
 *  10 D5 ¿quedan tramos por revisar?            11 D6 ¿min_i ≤ peso ≤ max_i?
 *  12 i = i + 1      13 D7 ¿tramo no encontrado? 14 error (sin tramo)
 *  15 cálculo de cargo, subtotal, descuento, recargo y total   16 fin
 *
 * V(G) = E − N + 2 = 22 − 16 + 2 = 8 = P + 1 (P = 7 nodos predicado).
 */
const shipment = (weightKg: number): Shipment => ({ weightKg, customerType: 'NUEVO', shippingType: 'ESTANDAR' });

/** Reglas con un hueco entre tramos (5.00–10.00 kg) para alcanzar el nodo 14. */
const RULES_WITH_GAP: PricingRules = {
  ...PRICING_RULES,
  weightTiers: [
    { minKg: 0.01, maxKg: 5, ratePerKgCents: 200 },
    { minKg: 10, maxKg: 20, ratePerKgCents: 400 },
  ],
};

describe('Caminos independientes de calculateShippingCost', () => {
  it.each([Number.NaN, Number.POSITIVE_INFINITY])('C1 1-2-3-16: peso %s no finito → InvalidWeightError', (weightKg) => {
    expect(() => calculateShippingCost(shipment(weightKg))).toThrow(
      new InvalidWeightError('El peso debe ser un número válido.'),
    );
  });

  it('C2 1-2-4-5-16: peso con más de 2 decimales → InvalidWeightError', () => {
    expect(() => calculateShippingCost(shipment(2.555))).toThrow(
      new InvalidWeightError('El peso admite como máximo 2 decimales.'),
    );
  });

  it('C3 1-2-4-6-7-16: peso por debajo del mínimo → InvalidWeightError', () => {
    expect(() => calculateShippingCost(shipment(0))).toThrow(new InvalidWeightError('El peso mínimo es 0.01 kg.'));
  });

  it('C4 1-2-4-6-8-9-16: peso por encima del máximo → WeightLimitExceededError', () => {
    expect(() => calculateShippingCost(shipment(20.01))).toThrow(WeightLimitExceededError);
  });

  it('C5 1-2-4-6-8-10-11-13-15-16: el peso cae en el primer tramo (1 iteración)', () => {
    const result = calculateShippingCost(shipment(3));

    expect(result.weightTier).toBe(PRICING_RULES.weightTiers[0]);
    expect(result.totalCents).toBe(1100);
  });

  it('C6 1-2-4-6-8-10-11-12-10-11-13-15-16: el peso cae en el segundo tramo (2 iteraciones)', () => {
    const result = calculateShippingCost(shipment(10));

    expect(result.weightTier).toBe(PRICING_RULES.weightTiers[1]);
    expect(result.totalCents).toBe(4500);
  });

  it('C7 1-2-4-6-8-10-11-12-10-11-12-10-13-14-16: ningún tramo contiene el peso → Error de configuración', () => {
    expect(() => calculateShippingCost(shipment(7), RULES_WITH_GAP)).toThrow(
      'No hay un tramo de peso configurado para 7 kg.',
    );
  });
});

/*
 * Cobertura de condiciones del nodo 11 (minKg ≤ peso && peso ≤ maxKg):
 *   C5 → tramo 1: V && V
 *   C6 → tramo 1: V && F; tramo 2: V && V
 *   C7 → tramo 1: V && F; tramo 2: F (cortocircuito)
 * Cada condición simple toma ambos valores.
 *
 * Camino infactible de la base: 1-2-4-6-8-10-11-13-14-16 (encontrar un tramo en el nodo 11
 * y entrar igualmente al nodo 14). D6 y D7 están correlacionadas: si el nodo 11 es verdadero,
 * el tramo existe y D7 siempre es falso.
 */
