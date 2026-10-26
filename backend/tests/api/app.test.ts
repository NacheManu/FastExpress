import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
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
          surchargePercent: 25,
          surcharge: 11.25,
          total: 47.25,
        },
      });
    });

    it('rechaza con 422 un envío de más de 20 kg', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/quote')
        .send({ ...validShipment, weightKg: 20.01 });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('WEIGHT_LIMIT_EXCEEDED');
    });

    it('rechaza con 400 un peso inválido', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/quote')
        .send({ ...validShipment, weightKg: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_WEIGHT');
      expect(res.body.error.details).toEqual([{ field: 'weightKg', message: 'El peso mínimo es 0.01 kg.' }]);
    });

    it('rechaza con 400 los campos ausentes o con valores no permitidos', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/quote')
        .send({ weightKg: '10', customerType: 'GOLD' });

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
        breakdown: { total: 47.25 },
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
});
