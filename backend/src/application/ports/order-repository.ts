import type { Order } from '../../domain/order/order.js';

/** Puerto de persistencia de órdenes. La infraestructura decide dónde se guardan. */
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | undefined>;
  /** Devuelve todas las órdenes, de la más reciente a la más antigua. */
  findAll(): Promise<Order[]>;
}
