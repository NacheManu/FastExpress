import { describe, expect, it } from 'vitest';
import { InvalidWeightError, WeightLimitExceededError } from '../../src/domain/errors.js';
import { calculateShippingCost } from '../../src/domain/pricing/calculate-shipping-cost.js';
import type { Shipment } from '../../src/domain/pricing/shipment.js';

const shipment = (overrides: Partial<Shipment> = {}): Shipment => ({
  weightKg: 1,
  customerType: 'NUEVO',
  shippingType: 'ESTANDAR',
  ...overrides,
});

describe('calculateShippingCost', () => {
  describe('BR-01: tarifa base', () => {
    it('aplica $5.00 de tarifa base a toda orden', () => {
      const result = calculateShippingCost(shipment({ weightKg: 0.01 }));

      expect(result.baseFeeCents).toBe(500);
      expect(result.subtotalCents).toBe(502);
      expect(result.totalCents).toBe(502);
    });
  });

  describe('BR-02: cálculo por peso', () => {
    it.each([
      { weightKg: 0.01, ratePerKgCents: 200, weightChargeCents: 2 },
      { weightKg: 1, ratePerKgCents: 200, weightChargeCents: 200 },
      { weightKg: 5, ratePerKgCents: 200, weightChargeCents: 1000 },
      { weightKg: 5.01, ratePerKgCents: 400, weightChargeCents: 2004 },
      { weightKg: 12.5, ratePerKgCents: 400, weightChargeCents: 5000 },
      { weightKg: 20, ratePerKgCents: 400, weightChargeCents: 8000 },
    ])('cobra $weightKg kg a $ratePerKgCents ¢/kg', ({ weightKg, ratePerKgCents, weightChargeCents }) => {
      const result = calculateShippingCost(shipment({ weightKg }));

      expect(result.weightTier.ratePerKgCents).toBe(ratePerKgCents);
      expect(result.weightChargeCents).toBe(weightChargeCents);
      expect(result.subtotalCents).toBe(500 + weightChargeCents);
    });

    it.each([20.01, 21, 100])('rechaza el envío de %s kg por exceder el límite', (weightKg) => {
      const act = () => calculateShippingCost(shipment({ weightKg }));

      expect(act).toThrow(WeightLimitExceededError);
      expect(act).toThrow(/límite permitido de 20.00 kg/);
    });

    it.each([0, -1, 0.001, 2.555, Number.NaN, Number.POSITIVE_INFINITY])(
      'rechaza el peso inválido %s',
      (weightKg) => {
        expect(() => calculateShippingCost(shipment({ weightKg }))).toThrow(InvalidWeightError);
      },
    );
  });

  describe('BR-03: descuento por tipo de cliente', () => {
    it.each([
      { customerType: 'NUEVO', discountPercent: 0, discountCents: 0, totalCents: 4500 },
      { customerType: 'FRECUENTE', discountPercent: 10, discountCents: 450, totalCents: 4050 },
      { customerType: 'VIP', discountPercent: 20, discountCents: 900, totalCents: 3600 },
    ] as const)(
      'aplica $discountPercent % a un cliente $customerType',
      ({ customerType, discountPercent, discountCents, totalCents }) => {
        const result = calculateShippingCost(shipment({ weightKg: 10, customerType }));

        expect(result.subtotalCents).toBe(4500);
        expect(result.discountPercent).toBe(discountPercent);
        expect(result.discountCents).toBe(discountCents);
        expect(result.totalCents).toBe(totalCents);
      },
    );
  });

  describe('BR-04: recargo por tipo de envío', () => {
    it.each([
      { shippingType: 'ESTANDAR', surchargePercent: 0, surchargeCents: 0, totalCents: 4500 },
      { shippingType: 'EXPRESS', surchargePercent: 25, surchargeCents: 1125, totalCents: 5625 },
    ] as const)(
      'aplica +$surchargePercent % a un envío $shippingType',
      ({ shippingType, surchargePercent, surchargeCents, totalCents }) => {
        const result = calculateShippingCost(shipment({ weightKg: 10, shippingType }));

        expect(result.surchargePercent).toBe(surchargePercent);
        expect(result.surchargeCents).toBe(surchargeCents);
        expect(result.totalCents).toBe(totalCents);
      },
    );
  });

  describe('reglas combinadas', () => {
    it('calcula descuento y recargo sobre el mismo subtotal', () => {
      const result = calculateShippingCost({ weightKg: 10, customerType: 'VIP', shippingType: 'EXPRESS' });

      expect(result).toMatchObject({
        baseFeeCents: 500,
        weightChargeCents: 4000,
        subtotalCents: 4500,
        discountCents: 900,
        surchargeCents: 1125,
        totalCents: 4725,
      });
    });

    it('redondea cada porcentaje al centavo más cercano', () => {
      const result = calculateShippingCost({
        weightKg: 0.03,
        customerType: 'FRECUENTE',
        shippingType: 'EXPRESS',
      });

      expect(result.subtotalCents).toBe(506);
      expect(result.discountCents).toBe(51); // 50.6
      expect(result.surchargeCents).toBe(127); // 126.5
      expect(result.totalCents).toBe(582);
    });
  });
});
