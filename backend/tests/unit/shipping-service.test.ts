import { describe, expect, it } from 'vitest';
import { OrderNotFoundError } from '../../src/application/errors.js';
import { ShippingService } from '../../src/application/shipping-service.js';
import { PRICING_RULES } from '../../src/domain/pricing/pricing-rules.js';
import { InMemoryOrderRepository } from '../../src/infrastructure/in-memory-order-repository.js';

describe('ShippingService', () => {
  it('usa las reglas, el generador de ids y el reloj reales por defecto', async () => {
    const service = new ShippingService({ orderRepository: new InMemoryOrderRepository() });
    const before = Date.now();

    const order = await service.createOrder({
      customerName: 'Ana',
      weightKg: 1,
      customerType: 'NUEVO',
      shippingType: 'ESTANDAR',
    });

    expect(service.getPricingRules()).toBe(PRICING_RULES);
    expect(order.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(order.createdAt.getTime()).toBeGreaterThanOrEqual(before);
    await expect(service.getOrder(order.id)).resolves.toBe(order);
  });

  it('lanza OrderNotFoundError si la orden no existe', async () => {
    const service = new ShippingService({ orderRepository: new InMemoryOrderRepository() });

    await expect(service.getOrder('x')).rejects.toBeInstanceOf(OrderNotFoundError);
  });
});
