import { describe, expect, it } from 'vitest';
import { blackBoxApi } from './helpers.js';

/**
 * Caja negra — campo Peso (BR-02).
 * Se fija cliente NUEVO y envío ESTANDAR para aislar el efecto del peso.
 */
const api = blackBoxApi();
const quoteWeight = (weightKg: unknown) =>
  api.quote({ weightKg, customerType: 'NUEVO', shippingType: 'ESTANDAR' });

describe('Particiones de equivalencia: Peso', () => {
  it.each([
    { id: 'EP-P-01', clase: 'CV1: 0.01 ≤ peso ≤ 5.00', weightKg: 3, ratePerKg: 2, weightCharge: 6, total: 11 },
    { id: 'EP-P-02', clase: 'CV2: 5.01 ≤ peso ≤ 20.00', weightKg: 12.5, ratePerKg: 4, weightCharge: 50, total: 55 },
  ])('$id $clase → 200, $ratePerKg USD/kg', async ({ weightKg, ratePerKg, weightCharge, total }) => {
    const res = await quoteWeight(weightKg);

    expect(res.status).toBe(200);
    expect(res.body.breakdown).toMatchObject({ weightTier: { ratePerKg }, weightCharge, total });
  });

  it.each([
    { id: 'EP-P-03', clase: 'CI1: peso < 0.01', weightKg: -2, status: 400, code: 'INVALID_WEIGHT' },
    { id: 'EP-P-04', clase: 'CI2: peso > 20.00', weightKg: 35, status: 422, code: 'WEIGHT_LIMIT_EXCEEDED' },
    { id: 'EP-P-05', clase: 'CI3: más de 2 decimales', weightKg: 2.555, status: 400, code: 'INVALID_WEIGHT' },
    { id: 'EP-P-06', clase: 'CI4: no numérico', weightKg: '10', status: 400, code: 'VALIDATION_ERROR' },
    { id: 'EP-P-07', clase: 'CI5: ausente', weightKg: undefined, status: 400, code: 'VALIDATION_ERROR' },
  ])('$id $clase → $status $code', async ({ weightKg, status, code }) => {
    const res = await quoteWeight(weightKg);

    expect(res.status).toBe(status);
    expect(res.body.error.code).toBe(code);
  });
});

describe('Análisis de valores límite: Peso', () => {
  it.each([
    { id: 'BVA-P-02', weightKg: 0.01, ratePerKg: 2, weightCharge: 0.02, total: 5.02 },
    { id: 'BVA-P-03', weightKg: 0.02, ratePerKg: 2, weightCharge: 0.04, total: 5.04 },
    { id: 'BVA-P-04', weightKg: 4.99, ratePerKg: 2, weightCharge: 9.98, total: 14.98 },
    { id: 'BVA-P-05', weightKg: 5.0, ratePerKg: 2, weightCharge: 10, total: 15 },
    { id: 'BVA-P-06', weightKg: 5.01, ratePerKg: 4, weightCharge: 20.04, total: 25.04 },
    { id: 'BVA-P-07', weightKg: 5.02, ratePerKg: 4, weightCharge: 20.08, total: 25.08 },
    { id: 'BVA-P-08', weightKg: 19.99, ratePerKg: 4, weightCharge: 79.96, total: 84.96 },
    { id: 'BVA-P-09', weightKg: 20.0, ratePerKg: 4, weightCharge: 80, total: 85 },
  ])('$id peso $weightKg kg → $ratePerKg USD/kg, total $total', async ({ weightKg, ratePerKg, weightCharge, total }) => {
    const res = await quoteWeight(weightKg);

    expect(res.status).toBe(200);
    expect(res.body.breakdown).toMatchObject({ weightTier: { ratePerKg }, weightCharge, total });
  });

  it.each([
    { id: 'BVA-P-01', weightKg: 0.0, status: 400, code: 'INVALID_WEIGHT' },
    { id: 'BVA-P-10', weightKg: 20.01, status: 422, code: 'WEIGHT_LIMIT_EXCEEDED' },
  ])('$id peso $weightKg kg → $status $code', async ({ weightKg, status, code }) => {
    const res = await quoteWeight(weightKg);

    expect(res.status).toBe(status);
    expect(res.body.error.code).toBe(code);
  });
});
