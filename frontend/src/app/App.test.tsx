import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

/** Integración de la aplicación completa (enrutado, estructura y tema) con el backend simulado. */
const { pricingService, orderService } = vi.hoisted(() => ({
  pricingService: { getRules: vi.fn(), quote: vi.fn() },
  orderService: { list: vi.fn(), get: vi.fn(), create: vi.fn() },
}));
vi.mock('../services/pricingService', () => ({ pricingService }));
vi.mock('../services/orderService', () => ({ orderService }));

function renderAt(path: string) {
  window.history.pushState({}, '', path);
  render(<App />);
  return userEvent.setup();
}

beforeEach(() => {
  localStorage.clear();
  pricingService.getRules.mockReset().mockRejectedValue(new Error('sin backend'));
  orderService.list.mockReset().mockResolvedValue([]);
});

describe('App', () => {
  it('abre el cotizador y navega a órdenes con la navegación principal', async () => {
    const user = renderAt('/');

    expect(screen.getByRole('heading', { level: 1, name: 'Cotizar envío' })).toBeInTheDocument();

    const [ordersLink] = screen.getAllByRole('link', { name: /Órdenes/ });
    await user.click(ordersLink!);

    expect(await screen.findByRole('heading', { level: 1, name: 'Órdenes' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/ordenes');
  });

  it('muestra la página no encontrada y permite volver al cotizador', async () => {
    const user = renderAt('/ruta-inexistente');

    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Ir al cotizador/ }));

    expect(screen.getByRole('heading', { level: 1, name: 'Cotizar envío' })).toBeInTheDocument();
  });

  it('personaliza el color y el modo desde el menú de tema', async () => {
    const user = renderAt('/');
    const openMenu = () => user.click(screen.getByRole('button', { name: 'Personalizar tema' }));

    await openMenu();
    const dialog = screen.getByRole('dialog', { name: 'Personalizar tema' });
    await user.click(screen.getByRole('radio', { name: 'Verde' }));
    await user.click(screen.getByRole('radio', { name: 'Oscuro' }));

    expect(screen.getByRole('radio', { name: 'Verde' })).toBeChecked();
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(JSON.parse(localStorage.getItem('fastexpress.theme') ?? '')).toEqual({ seedColor: '#146C2E', mode: 'dark' });

    // Pulsar dentro del panel no lo cierra; Escape sí.
    await user.click(dialog);
    expect(dialog).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Pulsar fuera también lo cierra; otras teclas no.
    await openMenu();
    await user.keyboard('a');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('heading', { level: 1 }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
