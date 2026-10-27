import type { Order } from '../models/order';
import type { OrderService } from '../services/orderService';
import { vi } from 'vitest';

export function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: '3f2a9c1e-0000-4000-8000-000000000001',
    customerName: 'Ana Pérez',
    createdAt: '2026-10-26T12:00:00.000Z',
    shipment: { weightKg: 10, customerType: 'VIP', shippingType: 'EXPRESS' },
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
    ...overrides,
  };
}

export function fakeOrderService(orders: Order[] = []) {
  return {
    list: vi.fn(async () => orders),
    get: vi.fn(async (id: string) => {
      const order = orders.find((candidate) => candidate.id === id);
      if (!order) {
        const { ApiError } = await import('../services/httpClient');
        throw new ApiError(404, 'ORDER_NOT_FOUND', `No existe una orden con id "${id}".`);
      }
      return order;
    }),
    create: vi.fn(async (input) => buildOrder({ customerName: input.customerName, shipment: input })),
  } satisfies OrderService;
}
