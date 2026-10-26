import cors from 'cors';
import express, { type Express } from 'express';
import type { ShippingService } from '../application/shipping-service.js';
import { errorHandler, notFoundHandler } from './error-handler.js';
import { orderRoutes } from './routes/order-routes.js';
import { pricingRoutes } from './routes/pricing-routes.js';

export interface AppDeps {
  shippingService: ShippingService;
  corsOrigins?: string[];
}

export function createApp({ shippingService, corsOrigins = [] }: AppDeps): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/v1/pricing', pricingRoutes(shippingService));
  app.use('/api/v1/orders', orderRoutes(shippingService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
