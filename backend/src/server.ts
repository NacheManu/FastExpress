import { createApp } from './api/app.js';
import { ShippingService } from './application/shipping-service.js';
import { loadConfig } from './config.js';
import { InMemoryOrderRepository } from './infrastructure/in-memory-order-repository.js';

const config = loadConfig();

const shippingService = new ShippingService({ orderRepository: new InMemoryOrderRepository() });
const app = createApp({ shippingService, corsOrigins: config.corsOrigins });

app.listen(config.port, () => {
  console.log(`FastExpress API escuchando en http://localhost:${config.port}`);
});
