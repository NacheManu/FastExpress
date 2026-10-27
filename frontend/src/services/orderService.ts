import type { CreateOrderInput, Order } from '../models/order';
import { http } from './httpClient';

export interface OrderService {
  list(signal?: AbortSignal): Promise<Order[]>;
  get(id: string, signal?: AbortSignal): Promise<Order>;
  create(input: CreateOrderInput): Promise<Order>;
}

export const orderService: OrderService = {
  list: async (signal) => (await http.get<{ data: Order[] }>('/orders', signal)).data,
  get: (id, signal) => http.get<Order>(`/orders/${encodeURIComponent(id)}`, signal),
  create: (input) => http.post<Order>('/orders', input),
};
