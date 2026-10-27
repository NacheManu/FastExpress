import request from 'supertest';
import { createApp } from '../../src/api/app.js';
import { ShippingService } from '../../src/application/shipping-service.js';
import { InMemoryOrderRepository } from '../../src/infrastructure/in-memory-order-repository.js';

/** Aplicación real (sin dobles): las pruebas de caja negra solo conocen la API. */
export function blackBoxApi() {
  const app = createApp({
    shippingService: new ShippingService({ orderRepository: new InMemoryOrderRepository() }),
  });
  return {
    quote: (body: unknown) => request(app).post('/api/v1/pricing/quote').send(body as object),
  };
}
