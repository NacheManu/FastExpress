import { describe, expect, it } from 'vitest';
import { blackBoxApi } from './helpers.js';

/**
 * Caja negra — Tabla de decisión: Tipo de Cliente (BR-03) × Tipo de Envío (BR-04).
 * Peso de referencia 10 kg → subtotal 45.00 USD. El factor sobre el subtotal es
 * (1 − descuento) × (1 + recargo), con descuento y recargo aplicados en cadena.
 */
const api = blackBoxApi();
const SUBTOTAL = 45;

describe('Tabla de decisión: Tipo de Cliente × Tipo de Envío', () => {
  it.each([
    { id: 'R1', customerType: 'NUEVO', shippingType: 'ESTANDAR', factor: 1, discount: 0, surcharge: 0, total: 45 },
    { id: 'R2', customerType: 'NUEVO', shippingType: 'EXPRESS', factor: 1.25, discount: 0, surcharge: 11.25, total: 56.25 },
    { id: 'R3', customerType: 'FRECUENTE', shippingType: 'ESTANDAR', factor: 0.9, discount: 4.5, surcharge: 0, total: 40.5 },
    { id: 'R4', customerType: 'FRECUENTE', shippingType: 'EXPRESS', factor: 1.125, discount: 4.5, surcharge: 10.13, total: 50.63 },
    { id: 'R5', customerType: 'VIP', shippingType: 'ESTANDAR', factor: 0.8, discount: 9, surcharge: 0, total: 36 },
    { id: 'R6', customerType: 'VIP', shippingType: 'EXPRESS', factor: 1, discount: 9, surcharge: 9, total: 45 },
  ])(
    '$id $customerType + $shippingType → factor $factor, total $total',
    async ({ customerType, shippingType, factor, discount, surcharge, total }) => {
      const res = await api.quote({ weightKg: 10, customerType, shippingType });

      expect(res.status).toBe(200);
      expect(res.body.breakdown).toMatchObject({
        subtotal: SUBTOTAL,
        discount,
        subtotalAfterDiscount: SUBTOTAL - discount,
        surcharge,
        total,
      });
      // El total es subtotal × factor redondeado al centavo (50.625 → 50.63).
      expect(res.body.breakdown.total).toBe(Math.round(SUBTOTAL * factor * 100) / 100);
    },
  );

  it('R7 peso fuera de rango → se rechaza sin importar cliente ni envío', async () => {
    for (const customerType of ['NUEVO', 'FRECUENTE', 'VIP']) {
      for (const shippingType of ['ESTANDAR', 'EXPRESS']) {
        const res = await api.quote({ weightKg: 25, customerType, shippingType });
        expect(res.status).toBe(422);
      }
    }
  });
});

describe('Particiones de equivalencia: campos categóricos', () => {
  it.each([
    { id: 'EP-C-02', campo: 'customerType', value: 'GOLD', code: 'INVALID_CUSTOMER_TYPE' },
    { id: 'EP-C-03', campo: 'customerType', value: 'vip', code: 'INVALID_CUSTOMER_TYPE' },
    { id: 'EP-E-02', campo: 'shippingType', value: 'NORMAL', code: 'INVALID_SHIPPING_TYPE' },
    { id: 'EP-E-03', campo: 'shippingType', value: 'express', code: 'INVALID_SHIPPING_TYPE' },
  ])('$id $campo = "$value" (desconocido) → 422 $code', async ({ campo, value, code }) => {
    const res = await api.quote({ weightKg: 10, customerType: 'NUEVO', shippingType: 'ESTANDAR', [campo]: value });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(code);
    expect(res.body.error.details).toEqual([{ field: campo, message: res.body.error.message }]);
  });

  it.each([
    { id: 'EP-C-04', campo: 'customerType', value: undefined, caso: 'ausente' },
    { id: 'EP-C-05', campo: 'customerType', value: 7, caso: 'no es texto' },
    { id: 'EP-E-04', campo: 'shippingType', value: undefined, caso: 'ausente' },
    { id: 'EP-E-05', campo: 'shippingType', value: true, caso: 'no es texto' },
  ])('$id $campo $caso → 400 VALIDATION_ERROR', async ({ campo, value }) => {
    const res = await api.quote({ weightKg: 10, customerType: 'NUEVO', shippingType: 'ESTANDAR', [campo]: value });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((detail: { field: string }) => detail.field)).toEqual([campo]);
  });
});
