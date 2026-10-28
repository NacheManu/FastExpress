import { randomUUID } from 'node:crypto';
import type { Order } from '../domain/order/order.js';
import {
  calculateShippingCost,
  type ShippingCostBreakdown,
} from '../domain/pricing/calculate-shipping-cost.js';
import { PRICING_RULES, type PricingRules } from '../domain/pricing/pricing-rules.js';
import { toShipment, type Shipment, type ShipmentInput } from '../domain/pricing/shipment.js';
import { OrderNotFoundError } from './errors.js';
import type { OrderRepository } from './ports/order-repository.js';

export interface CreateOrderInput extends ShipmentInput {
  customerName: string;
}

/** Envío validado junto con su tarifa. */
export interface Quotation {
  shipment: Shipment;
  pricing: ShippingCostBreakdown;
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

  /**
   * Valida los tipos de cliente y de envío y calcula la tarifa.
   * @throws DomainError si el envío incumple alguna regla de negocio.
   */
  quote(input: ShipmentInput): Quotation {
    const shipment = toShipment(input);
    return { shipment, pricing: calculateShippingCost(shipment, this.rules) };
  }

  async createOrder({ customerName, ...input }: CreateOrderInput): Promise<Order> {
    const { shipment, pricing } = this.quote(input);
    const order: Order = {
      id: this.generateId(),
      customerName,
      shipment,
      pricing,
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
