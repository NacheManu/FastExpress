import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../services/httpClient';
import { buildOrder, fakeOrderService } from '../test/orderTestData';
import { useOrderDetailViewModel } from './useOrderDetailViewModel';

describe('useOrderDetailViewModel', () => {
  it('carga la orden por id', async () => {
    const order = buildOrder();
    const { result } = renderHook(() =>
      useOrderDetailViewModel(order.id, { orderService: fakeOrderService([order]) }),
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.status === 'ready' && result.current.order.customerName).toBe('Ana Pérez');
  });

  it('distingue una orden inexistente de un error', async () => {
    const { result } = renderHook(() => useOrderDetailViewModel('no-existe', { orderService: fakeOrderService() }));

    await waitFor(() => expect(result.current.status).toBe('not-found'));
  });
});

describe('useOrderDetailViewModel: errores y cancelación', () => {
  it('distingue un error de la API de una orden inexistente', async () => {
    const service = fakeOrderService();
    service.get.mockRejectedValueOnce(new ApiError(503, 'UNAVAILABLE', 'Servicio no disponible.'));
    const { result } = renderHook(() => useOrderDetailViewModel('x', { orderService: service }));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.status === 'error' && result.current.message).toBe('Servicio no disponible.');
  });

  it('ignora la respuesta si la vista se desmontó antes', async () => {
    const service = fakeOrderService();
    let fail: (error: Error) => void = () => {};
    service.get.mockReturnValueOnce(new Promise((_resolve, reject) => (fail = reject)));
    const { result, unmount } = renderHook(() => useOrderDetailViewModel('x', { orderService: service }));

    unmount();
    fail(new Error('tarde'));
    await Promise.resolve();

    expect(result.current.status).toBe('loading');
  });
});
