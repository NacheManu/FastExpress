import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../services/httpClient';
import { buildOrder } from '../../test/orderTestData';
import { OrderDetailPage } from './OrderDetailPage';

const { orderService } = vi.hoisted(() => ({
  orderService: { list: vi.fn(), get: vi.fn(), create: vi.fn() },
}));
vi.mock('../../services/orderService', () => ({ orderService }));

const ORDER = buildOrder();

function renderAt(orderId: string) {
  render(
    <MemoryRouter initialEntries={[`/ordenes/${orderId}`]}>
      <Routes>
        <Route path="/ordenes" element={<p>Listado de órdenes</p>} />
        <Route path="/ordenes/:orderId" element={<OrderDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

beforeEach(() => {
  orderService.get.mockReset();
});

describe('OrderDetailPage', () => {
  it('muestra la orden con su desglose y vuelve al listado', async () => {
    orderService.get.mockResolvedValue(ORDER);
    const user = renderAt(ORDER.id);

    expect(screen.getByRole('progressbar', { name: 'Cargando orden' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Orden #3F2A9C1E' })).toBeInTheDocument();
    expect(orderService.get).toHaveBeenCalledWith(ORDER.id, expect.any(AbortSignal));
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getAllByText('$45.00').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Volver a órdenes' }));

    expect(screen.getByText('Listado de órdenes')).toBeInTheDocument();
  });

  it('informa cuando la orden no existe', async () => {
    orderService.get.mockRejectedValue(new ApiError(404, 'ORDER_NOT_FOUND', 'No existe.'));
    renderAt('no-existe');

    expect(await screen.findByText('Orden no encontrada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver todas las órdenes' })).toHaveAttribute('href', '/ordenes');
  });

  it('muestra el error y permite reintentar', async () => {
    orderService.get.mockRejectedValueOnce(new Error('caída')).mockResolvedValue(ORDER);
    const user = renderAt(ORDER.id);

    expect(await screen.findByText('No se pudo cargar la orden.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Reintentar/ }));

    expect(await screen.findByRole('heading', { name: 'Orden #3F2A9C1E' })).toBeInTheDocument();
  });
});
