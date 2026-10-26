import { randomUUID } from 'node:crypto';
import type { Order } from '../domain/order/order.js';
import {
  calculateShippingCost,
  type ShippingCostBreakdown,
} from '../domain/pricing/calculate-shipping-cost.js';
import { PRICING_RULES, type PricingRules } from '../domain/pricing/pricing-rules.js';
import type { Shipment } from '../domain/pricing/shipment.js';
import { OrderNotFoundError } from './errors.js';
import type { OrderRepository } from './ports/order-repository.js';

export interface CreateOrderInput extends Shipment {
  customerName: string;
}

export interface ShippingServiceDeps {
  orderRepository: OrderRepository;
  rules?: PricingRules;
  generateId?: () => string;
  now?: () => Date;
}

/** Casos de uso de cotización y gestión de órdenes de envío. */
export class ShippingService {
  private readonly orderRepository: OrderRepository;
  private readonly rules: PricingRules;
  private readonly generateId: () => string;
  private readonly now: () => Date;

  constructor(deps: ShippingServiceDeps) {
    this.orderRepository = deps.orderRepository;
    this.rules = deps.rules ?? PRICING_RULES;
    this.generateId = deps.generateId ?? randomUUID;
    this.now = deps.now ?? (() => new Date());
  }

  getPricingRules(): PricingRules {
    return this.rules;
  }

  quote(shipment: Shipment): ShippingCostBreakdown {
    return calculateShippingCost(shipment, this.rules);
  }

  async createOrder({ customerName, ...shipment }: CreateOrderInput): Promise<Order> {
    const order: Order = {
      id: this.generateId(),
      customerName,
      shipment,
      pricing: this.quote(shipment),
      createdAt: this.now(),
    };

    await this.orderRepository.save(order);
    return order;
  }

  listOrders(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }

  async getOrder(id: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new OrderNotFoundError(id);
    }
    return order;
  }
}
