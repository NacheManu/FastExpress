import { describe, expect, it } from 'vitest';
import { blackBoxApi } from './helpers.js';

/**
 * Caja negra — Monto (importe calculado).
 * El sistema no recibe un monto de entrada: se particiona el dominio de salida
 * (cargo por peso y total a pagar) y se prueban sus límites y el redondeo al centavo.
 */
const api = blackBoxApi();

describe('Particiones de equivalencia: Monto', () => {
  it.each([
    {
      id: 'EP-M-01',
      clase: 'cargo por peso en [0.02, 10.00]',
      shipment: { weightKg: 2.5, customerType: 'NUEVO', shippingType: 'ESTANDAR' },
      expected: { weightCharge: 5, total: 10 },
    },
    {
      id: 'EP-M-02',
      clase: 'cargo por peso en [20.04, 80.00]',
      shipment: { weightKg: 8, customerType: 'NUEVO', shippingType: 'ESTANDAR' },
      expected: { weightCharge: 32, total: 37 },
    },
    {
      id: 'EP-M-04',
      clase: 'total en [4.02, 106.25]',
      shipment: { weightKg: 10, customerType: 'VIP', shippingType: 'EXPRESS' },
      expected: { subtotal: 45, discount: 9, surcharge: 11.25, total: 47.25 },
    },
    {
      id: 'EP-M-05',
      clase: 'monto con fracción de centavo (se redondea)',
      shipment: { weightKg: 0.03, customerType: 'FRECUENTE', shippingType: 'EXPRESS' },
      expected: { subtotal: 5.06, discount: 0.51, surcharge: 1.27, total: 5.82 },
    },
  ])('$id $clase', async ({ shipment, expected }) => {
    const res = await api.quote(shipment);

    expect(res.status).toBe(200);
    expect(res.body.breakdown).toMatchObject(expected);
  });

  it('EP-M-03 ningún peso válido produce un cargo entre 10.00 y 20.04 (salto de tramo)', async () => {
    const lastOfTier1 = await api.quote({ weightKg: 5, customerType: 'NUEVO', shippingType: 'ESTANDAR' });
    const firstOfTier2 = await api.quote({ weightKg: 5.01, customerType: 'NUEVO', shippingType: 'ESTANDAR' });

    expect(lastOfTier1.body.breakdown.weightCharge).toBe(10);
    expect(firstOfTier2.body.breakdown.weightCharge).toBe(20.04);
  });

  it('EP-M-06 un total superior a 106.25 no se genera: el envío se rechaza', async () => {
    const res = await api.quote({ weightKg: 20.01, customerType: 'NUEVO', shippingType: 'EXPRESS' });

    expect(res.status).toBe(422);
    expect(res.body.breakdown).toBeUndefined();
  });
});

describe('Análisis de valores límite: Monto', () => {
  it.each([
    {
      id: 'BVA-M-01',
      caso: 'total mínimo posible',
      shipment: { weightKg: 0.01, customerType: 'VIP', shippingType: 'ESTANDAR' },
      expected: { subtotal: 5.02, discount: 1, total: 4.02 },
    },
    {
      id: 'BVA-M-02',
      caso: 'total máximo posible',
      shipment: { weightKg: 20, customerType: 'NUEVO', shippingType: 'EXPRESS' },
      expected: { subtotal: 85, surcharge: 21.25, total: 106.25 },
    },
    {
      id: 'BVA-M-04',
      caso: 'cargo por peso máximo del tramo 1',
      shipment: { weightKg: 5, customerType: 'NUEVO', shippingType: 'ESTANDAR' },
      expected: { weightCharge: 10 },
    },
    {
      id: 'BVA-M-05',
      caso: 'cargo por peso mínimo del tramo 2',
      shipment: { weightKg: 5.01, customerType: 'NUEVO', shippingType: 'ESTANDAR' },
      expected: { weightCharge: 20.04 },
    },
    {
      id: 'BVA-M-06',
      caso: 'medio centavo exacto: redondea hacia arriba (1.255 → 1.26)',
      shipment: { weightKg: 0.01, customerType: 'NUEVO', shippingType: 'EXPRESS' },
      expected: { surcharge: 1.26, total: 6.28 },
    },
    {
      id: 'BVA-M-07',
      caso: 'por debajo del medio centavo: redondea hacia abajo (0.502 → 0.50)',
      shipment: { weightKg: 0.01, customerType: 'FRECUENTE', shippingType: 'ESTANDAR' },
      expected: { discount: 0.5, total: 4.52 },
    },
    {
      id: 'BVA-M-08',
      caso: 'importe exacto: sin redondeo (1.26)',
      shipment: { weightKg: 0.02, customerType: 'NUEVO', shippingType: 'EXPRESS' },
      expected: { surcharge: 1.26, total: 6.3 },
    },
  ])('$id $caso', async ({ shipment, expected }) => {
    const res = await api.quote(shipment);

    expect(res.status).toBe(200);
    expect(res.body.breakdown).toMatchObject(expected);
  });

  it('BVA-M-03 justo por encima del total máximo (20.01 kg) → 422', async () => {
    const res = await api.quote({ weightKg: 20.01, customerType: 'NUEVO', shippingType: 'EXPRESS' });

    expect(res.status).toBe(422);
  });
});
