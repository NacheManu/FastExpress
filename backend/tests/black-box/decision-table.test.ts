import { describe, expect, it } from 'vitest';
import { blackBoxApi } from './helpers.js';

/**
 * Caja negra — Tabla de decisión: Tipo de Cliente (BR-03) × Tipo de Envío (BR-04).
 * Peso de referencia 10 kg → subtotal 45.00 USD.
 */
const api = blackBoxApi();

describe('Tabla de decisión: Tipo de Cliente × Tipo de Envío', () => {
  it.each([
    { id: 'R1', customerType: 'NUEVO', shippingType: 'ESTANDAR', discount: 0, surcharge: 0, total: 45 },
    { id: 'R2', customerType: 'NUEVO', shippingType: 'EXPRESS', discount: 0, surcharge: 11.25, total: 56.25 },
    { id: 'R3', customerType: 'FRECUENTE', shippingType: 'ESTANDAR', discount: 4.5, surcharge: 0, total: 40.5 },
    { id: 'R4', customerType: 'FRECUENTE', shippingType: 'EXPRESS', discount: 4.5, surcharge: 11.25, total: 51.75 },
    { id: 'R5', customerType: 'VIP', shippingType: 'ESTANDAR', discount: 9, surcharge: 0, total: 36 },
    { id: 'R6', customerType: 'VIP', shippingType: 'EXPRESS', discount: 9, surcharge: 11.25, total: 47.25 },
  ])('$id $customerType + $shippingType → total $total', async ({ customerType, shippingType, discount, surcharge, total }) => {
    const res = await api.quote({ weightKg: 10, customerType, shippingType });

    expect(res.status).toBe(200);
    expect(res.body.breakdown).toMatchObject({ subtotal: 45, discount, surcharge, total });
  });

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
    { id: 'EP-C-02', campo: 'customerType', value: 'GOLD' },
    { id: 'EP-C-03', campo: 'customerType', value: 'vip' },
    { id: 'EP-C-04', campo: 'customerType', value: undefined },
    { id: 'EP-E-02', campo: 'shippingType', value: 'NORMAL' },
    { id: 'EP-E-03', campo: 'shippingType', value: 'express' },
    { id: 'EP-E-04', campo: 'shippingType', value: undefined },
  ])('$id $campo = $value → 400 VALIDATION_ERROR', async ({ campo, value }) => {
    const res = await api.quote({ weightKg: 10, customerType: 'NUEVO', shippingType: 'ESTANDAR', [campo]: value });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((detail: { field: string }) => detail.field)).toEqual([campo]);
  });
});
