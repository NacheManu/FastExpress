import { Router } from 'express';
import type { ShippingService } from '../../application/shipping-service.js';
import { presentOrder } from '../presenters.js';
import { createOrderSchema } from '../schemas.js';

export function orderRoutes(service: ShippingService): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const orders = await service.listOrders();
    res.json({ data: orders.map(presentOrder) });
  });

  router.post('/', async (req, res) => {
    const order = await service.createOrder(createOrderSchema.parse(req.body));
    res.status(201).location(`${req.baseUrl}/${order.id}`).json(presentOrder(order));
  });

  router.get('/:id', async (req, res) => {
    const order = await service.getOrder(req.params.id);
    res.json(presentOrder(order));
  });

  return router;
}
