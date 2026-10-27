import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatOrderNumber, type Order } from '../models/order';
import { ApiError } from '../services/httpClient';
import { orderService as defaultOrderService, type OrderService } from '../services/orderService';

type OrdersState =
  | { status: 'loading' }
  | { status: 'ready'; orders: Order[] }
  | { status: 'error'; message: string };

/** Minúsculas y sin tildes, para buscar "jose" y encontrar "José". */
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** ViewModel del historial de órdenes: carga, búsqueda y métricas resumidas. */
export function useOrdersViewModel({ orderService = defaultOrderService }: { orderService?: OrderService } = {}) {
  const [state, setState] = useState<OrdersState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    orderService.list(controller.signal).then(
      (orders) => setState({ status: 'ready', orders }),
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            status: 'error',
            message: error instanceof ApiError ? error.message : 'No se pudieron cargar las órdenes.',
          });
        }
      },
    );
    return () => controller.abort();
  }, [orderService, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  const allOrders = useMemo(() => (state.status === 'ready' ? state.orders : []), [state]);

  const orders = useMemo(() => {
    const term = normalize(query);
    if (!term) {
      return allOrders;
    }
    return allOrders.filter(
      (order) =>
        normalize(order.customerName).includes(term) || normalize(formatOrderNumber(order.id)).includes(term),
    );
  }, [allOrders, query]);

  const stats = useMemo(() => {
    // Se suma en centavos para no acumular errores de coma flotante.
    const revenueCents = allOrders.reduce((sum, order) => sum + Math.round(order.breakdown.total * 100), 0);
    return {
      count: allOrders.length,
      expressCount: allOrders.filter((order) => order.shipment.shippingType === 'EXPRESS').length,
      revenue: revenueCents / 100,
      averageTicket: allOrders.length ? Math.round(revenueCents / allOrders.length) / 100 : 0,
      currency: allOrders[0]?.currency ?? 'USD',
    };
  }, [allOrders]);

  return {
    status: state.status,
    error: state.status === 'error' ? state.message : null,
    orders,
    hasOrders: allOrders.length > 0,
    stats,
    query,
    setQuery,
    retry,
  };
}
