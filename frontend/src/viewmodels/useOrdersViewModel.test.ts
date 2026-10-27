import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../services/httpClient';
import { buildOrder, fakeOrderService } from '../test/orderTestData';
import { useOrdersViewModel } from './useOrdersViewModel';

const ORDERS = [
  buildOrder({ id: 'aaaa1111-0000', customerName: 'José Gómez' }),
  buildOrder({
    id: 'bbbb2222-0000',
    customerName: 'Ana Pérez',
    shipment: { weightKg: 2, customerType: 'NUEVO', shippingType: 'ESTANDAR' },
    breakdown: { ...buildOrder().breakdown, total: 9.1 },
  }),
];

describe('useOrdersViewModel', () => {
  it('carga las órdenes y calcula las métricas', async () => {
    const { result } = renderHook(() => useOrdersViewModel({ orderService: fakeOrderService(ORDERS) }));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.orders).toHaveLength(2);
    expect(result.current.stats).toEqual({
      count: 2,
      expressCount: 1,
      revenue: 56.35,
      averageTicket: 28.18,
      currency: 'USD',
    });
  });

  it('filtra por nombre sin distinguir tildes ni mayúsculas, y por número de orden', async () => {
    const { result } = renderHook(() => useOrdersViewModel({ orderService: fakeOrderService(ORDERS) }));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => result.current.setQuery('JOSE'));
    expect(result.current.orders.map((order) => order.customerName)).toEqual(['José Gómez']);

    act(() => result.current.setQuery('#bbbb'));
    expect(result.current.orders.map((order) => order.customerName)).toEqual(['Ana Pérez']);
  });

  it('expone el error y permite reintentar', async () => {
    const service = fakeOrderService(ORDERS);
    service.list.mockRejectedValueOnce(new ApiError(0, 'NETWORK_ERROR', 'Sin conexión.'));
    const { result } = renderHook(() => useOrdersViewModel({ orderService: service }));

    await waitFor(() => expect(result.current.error).toBe('Sin conexión.'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.hasOrders).toBe(true);
  });
});

describe('useOrdersViewModel: errores y cancelación', () => {
  it('usa un mensaje general ante un error que no es de la API', async () => {
    const service = fakeOrderService(ORDERS);
    service.list.mockRejectedValueOnce(new Error('caída'));
    const { result } = renderHook(() => useOrdersViewModel({ orderService: service }));

    await waitFor(() => expect(result.current.error).toBe('No se pudieron cargar las órdenes.'));
  });

  it('ignora la respuesta si la vista se desmontó antes', async () => {
    const service = fakeOrderService(ORDERS);
    let fail: (error: Error) => void = () => {};
    service.list.mockReturnValueOnce(new Promise((_resolve, reject) => (fail = reject)));
    const { result, unmount } = renderHook(() => useOrdersViewModel({ orderService: service }));

    unmount();
    fail(new Error('tarde'));
    await Promise.resolve();

    expect(result.current.status).toBe('loading');
  });
});
