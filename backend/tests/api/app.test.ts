import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/api/app.js';
import { ShippingService } from '../../src/application/shipping-service.js';
import { InMemoryOrderRepository } from '../../src/infrastructure/in-memory-order-repository.js';

function buildApp() {
  let sequence = 0;
  const shippingService = new ShippingService({
    orderRepository: new InMemoryOrderRepository(),
    generateId: () => `order-${++sequence}`,
    now: () => new Date('2026-10-26T12:00:00.000Z'),
  });
  return createApp({ shippingService });
}

const validShipment = { weightKg: 10, customerType: 'VIP', shippingType: 'EXPRESS' };

describe('FastExpress API', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  it('GET /api/health responde ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  describe('GET /api/v1/pricing/rules', () => {
    it('expone las reglas de tarifa vigentes', async () => {
      const res = await request(app).get('/api/v1/pricing/rules');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        currency: 'USD',
        baseFee: 5,
        minWeightKg: 0.01,
        maxWeightKg: 20,
        weightTiers: [
          { minKg: 0.01, maxKg: 5, ratePerKg: 2 },
          { minKg: 5.01, maxKg: 20, ratePerKg: 4 },
        ],
        customerDiscountPercent: { NUEVO: 0, FRECUENTE: 10, VIP: 20 },
        shippingSurchargePercent: { ESTANDAR: 0, EXPRESS: 25 },
      });
    });
  });

  describe('POST /api/v1/pricing/quote', () => {
    it('devuelve el desglose de la tarifa', async () => {
      const res = await request(app).post('/api/v1/pricing/quote').send(validShipment);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        shipment: validShipment,
        currency: 'USD',
        breakdown: {
          baseFee: 5,
          weightTier: { minKg: 5.01, maxKg: 20, ratePerKg: 4 },
          weightCharge: 40,
          subtotal: 45,
          discountPercent: 20,
          discount: 9,
          subtotalAfterDiscount: 36,
          surchargePercent: 25,
          surcharge: 9,
          total: 45,
        },
      });
    });

    it('rechaza con 422 un envío de más de 20 kg, indicando el campo y el motivo', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/quote')
        .send({ ...validShipment, weightKg: 20.01 });

      expect(res.status).toBe(422);
      expect(res.body.error).toEqual({
        code: 'WEIGHT_LIMIT_EXCEEDED',
        message: 'El peso máximo permitido es 20 kg. Reduce el peso e inténtalo de nuevo.',
        details: [{ field: 'weightKg', message: 'El peso máximo permitido es 20 kg. Reduce el peso e inténtalo de nuevo.' }],
      });
    });

    it('rechaza con 422 un peso que no es positivo', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/quote')
        .send({ ...validShipment, weightKg: 0 });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_WEIGHT');
      expect(res.body.error.details).toEqual([{ field: 'weightKg', message: 'El peso mínimo es 0.01 kg.' }]);
    });

    it('rechaza con 422 un tipo de cliente desconocido', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/quote')
        .send({ ...validShipment, customerType: 'GOLD' });

      expect(res.status).toBe(422);
      expect(res.body.error).toEqual({
        code: 'INVALID_CUSTOMER_TYPE',
        message: 'El tipo de cliente "GOLD" no existe. Valores permitidos: NUEVO, FRECUENTE, VIP.',
        details: [
          { field: 'customerType', message: 'El tipo de cliente "GOLD" no existe. Valores permitidos: NUEVO, FRECUENTE, VIP.' },
        ],
      });
    });

    it('rechaza con 400 los campos ausentes o con tipo incorrecto', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/quote')
        .send({ weightKg: '10', customerType: 7 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.map((detail: { field: string }) => detail.field)).toEqual([
        'weightKg',
        'customerType',
        'shippingType',
      ]);
    });

    it('rechaza con 400 un JSON mal formado', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/quote')
        .set('Content-Type', 'application/json')
        .send('{"weightKg": ');

      expect(res.status).toBe(400);
      expect(res.body.error).toEqual({
        code: 'BAD_REQUEST',
        message: 'El cuerpo de la petición no es un JSON válido.',
      });
    });
  });

  describe('/api/v1/orders', () => {
    it('crea una orden con la tarifa calculada', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .send({ ...validShipment, customerName: '  Ana Pérez  ' });

      expect(res.status).toBe(201);
      expect(res.headers.location).toBe('/api/v1/orders/order-1');
      expect(res.body).toMatchObject({
        id: 'order-1',
        customerName: 'Ana Pérez',
        createdAt: '2026-10-26T12:00:00.000Z',
        shipment: validShipment,
        currency: 'USD',
        breakdown: { total: 45 },
      });
    });

    it('no crea la orden si el envío se rechaza', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .send({ ...validShipment, weightKg: 25, customerName: 'Ana' });
      const list = await request(app).get('/api/v1/orders');

      expect(res.status).toBe(422);
      expect(list.body.data).toEqual([]);
    });

    it('exige el nombre del cliente', async () => {
      const res = await request(app).post('/api/v1/orders').send({ ...validShipment, customerName: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([
        { field: 'customerName', message: 'El nombre del cliente no puede estar vacío.' },
      ]);
    });

    it('lista las órdenes de la más reciente a la más antigua', async () => {
      await request(app).post('/api/v1/orders').send({ ...validShipment, customerName: 'Primera' });
      await request(app).post('/api/v1/orders').send({ ...validShipment, customerName: 'Segunda' });

      const res = await request(app).get('/api/v1/orders');

      expect(res.status).toBe(200);
      expect(res.body.data.map((order: { customerName: string }) => order.customerName)).toEqual([
        'Segunda',
        'Primera',
      ]);
    });

    it('obtiene una orden por id', async () => {
      await request(app).post('/api/v1/orders').send({ ...validShipment, customerName: 'Ana' });

      const res = await request(app).get('/api/v1/orders/order-1');

      expect(res.status).toBe(200);
      expect(res.body.customerName).toBe('Ana');
    });

    it('responde 404 si la orden no existe', async () => {
      const res = await request(app).get('/api/v1/orders/no-existe');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
    });
  });

  it('responde 404 en rutas desconocidas', async () => {
    const res = await request(app).get('/api/v1/desconocida');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('responde 413 si el cuerpo supera el tamaño máximo', async () => {
    const res = await request(app)
      .post('/api/v1/pricing/quote')
      .send({ ...validShipment, padding: 'x'.repeat(20_000) });

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  describe('errores inesperados', () => {
    function appWithFailingRepository(failure: unknown) {
      const shippingService = new ShippingService({
        orderRepository: {
          save: () => Promise.reject(failure),
          findById: () => Promise.reject(failure),
          findAll: () => Promise.reject(failure),
        },
      });
      return createApp({ shippingService });
    }

    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it.each([
      { caso: 'un Error', failure: new Error('base de datos caída') },
      { caso: 'un valor que no es un objeto', failure: 'fallo' },
      { caso: 'un objeto con status 5xx', failure: { status: 503, message: 'no disponible' } },
    ])('responde 500 sin filtrar detalles cuando se lanza $caso', async ({ failure }) => {
      const res = await request(appWithFailingRepository(failure)).get('/api/v1/orders');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: { code: 'INTERNAL_ERROR', message: 'Ha ocurrido un error inesperado.' },
      });
      expect(console.error).toHaveBeenCalledWith(failure);
    });
  });
});
