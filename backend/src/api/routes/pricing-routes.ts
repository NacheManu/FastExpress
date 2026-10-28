import { Router } from 'express';
import type { ShippingService } from '../../application/shipping-service.js';
import { presentPricingRules, presentQuote } from '../presenters.js';
import { shipmentSchema } from '../schemas.js';

export function pricingRoutes(service: ShippingService): Router {
  const router = Router();

  router.get('/rules', (_req, res) => {
    res.json(presentPricingRules(service.getPricingRules()));
  });

  router.post('/quote', (req, res) => {
    const { shipment, pricing } = service.quote(shipmentSchema.parse(req.body));
    res.json(presentQuote(shipment, pricing));
  });

  return router;
}
