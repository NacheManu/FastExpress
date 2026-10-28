import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../services/httpClient';
import { buildOrder } from '../../test/orderTestData';
import { OrdersPage } from './OrdersPage';

const { orderService } = vi.hoisted(() => ({
  orderService: { list: vi.fn(), get: vi.fn(), create: vi.fn() },
}));
vi.mock('../../services/orderService', () => ({ orderService }));

const ORDERS = [
  buildOrder({ id: 'aaaa1111-0000', customerName: 'José Gómez', createdAt: '2026-10-26T15:30:00.000Z' }),
  buildOrder({
    id: 'bbbb2222-0000',
    customerName: 'Ana',
    shipment: { weightKg: 2, customerType: 'NUEVO', shippingType: 'ESTANDAR' },
    breakdown: { ...buildOrder().breakdown, total: 9 },
  }),
];

function renderPage() {
  render(
    <MemoryRouter>
      <OrdersPage />
    </MemoryRouter>,
  );
  return userEvent.setup();
}

beforeEach(() => {
  orderService.list.mockReset();
});

describe('OrdersPage', () => {
  it('muestra las métricas y el historial con enlace al detalle', async () => {
    orderService.list.mockResolvedValue(ORDERS);
    renderPage();

    expect(screen.getByRole('progressbar', { name: 'Cargando órdenes' })).toBeInTheDocument();
    const list = await screen.findByRole('list');

    expect(screen.getByText('Facturado').closest('div')).toHaveTextContent('$54.00');
    expect(screen.getByText('1 express')).toBeInTheDocument();
    const items = within(list).getAllByRole('link');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute('href', '/ordenes/aaaa1111-0000');
    expect(items[0]).toHaveTextContent('JG');
    expect(items[0]).toHaveTextContent('#AAAA1111');
    expect(items[0]).toHaveTextContent('$45.00');
    expect(screen.getByRole('link', { name: /Nueva orden/ })).toHaveAttribute('href', '/');
  });

  it('filtra por cliente e informa cuando nada coincide', async () => {
    orderService.list.mockResolvedValue(ORDERS);
    const user = renderPage();
    const search = await screen.findByLabelText('Buscar por cliente o número');

    await user.type(search, 'jose');
    expect(within(screen.getByRole('list')).getAllByRole('link')).toHaveLength(1);

    await user.clear(search);
    await user.type(search, 'zzz');
    expect(screen.getByText('Ninguna orden coincide con “zzz”.')).toBeInTheDocument();
  });

  it('muestra el estado vacío con un acceso al cotizador', async () => {
    orderService.list.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('Aún no hay órdenes')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Nueva orden/ })).toHaveAttribute('href', '/');
  });

  it('muestra el error y permite reintentar', async () => {
    orderService.list.mockRejectedValueOnce(new ApiError(0, 'NETWORK_ERROR', 'Sin conexión.')).mockResolvedValue(ORDERS);
    const user = renderPage();

    expect(await screen.findByText('Sin conexión.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Reintentar/ }));

    expect(await screen.findByRole('list')).toBeInTheDocument();
  });
});
