import { useCallback, useEffect, useState } from 'react';
import type { Order } from '../models/order';
import { ApiError } from '../services/httpClient';
import { orderService as defaultOrderService, type OrderService } from '../services/orderService';

type OrderDetailState =
  | { status: 'loading' }
  | { status: 'ready'; order: Order }
  | { status: 'not-found' }
  | { status: 'error'; message: string };

/** ViewModel del detalle de una orden (GET /orders/:id). */
export function useOrderDetailViewModel(
  orderId: string,
  { orderService = defaultOrderService }: { orderService?: OrderService } = {},
) {
  const [state, setState] = useState<OrderDetailState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    orderService.get(orderId, controller.signal).then(
      (order) => setState({ status: 'ready', order }),
      (error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          setState({ status: 'not-found' });
        } else {
          setState({
            status: 'error',
            message: error instanceof ApiError ? error.message : 'No se pudo cargar la orden.',
          });
        }
      },
    );
    return () => controller.abort();
  }, [orderId, orderService, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, retry } as OrderDetailState & { retry: () => void };
}
