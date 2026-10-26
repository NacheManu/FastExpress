import type { OrderRepository } from '../application/ports/order-repository.js';
import type { Order } from '../domain/order/order.js';

/** Repositorio en memoria: los datos se pierden al reiniciar el servidor. */
export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    this.orders.set(order.id, order);
  }

  async findById(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async findAll(): Promise<Order[]> {
    // Un Map conserva el orden de inserción; se invierte para devolver primero la más reciente.
    return [...this.orders.values()].reverse();
  }
}
