import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
