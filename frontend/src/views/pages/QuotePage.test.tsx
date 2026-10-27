import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SnackbarProvider } from '../../core/feedback/SnackbarProvider';
import type { Quote } from '../../models/pricing';
import type { Shipment } from '../../models/shipment';
import { ApiError } from '../../services/httpClient';
import { QuotePage } from './QuotePage';

/**
 * Caja negra desde la interfaz: se simula el backend y se comprueba lo que ve el usuario
 * para cada partición del campo Peso.
 */
const { quote, getRules } = vi.hoisted(() => ({ quote: vi.fn(), getRules: vi.fn() }));
vi.mock('../../services/pricingService', () => ({ pricingService: { quote, getRules } }));

const quoteFor = (shipment: Shipment, total: number): Quote => ({
  shipment,
  currency: 'USD',
  breakdown: {
    baseFee: 5,
    weightTier: { minKg: 0.01, maxKg: 5, ratePerKg: 2 },
    weightCharge: total - 5,
    subtotal: total,
    discountPercent: 0,
    discount: 0,
    surchargePercent: 0,
    surcharge: 0,
    total,
  },
});

function renderPage() {
  render(
    <MemoryRouter>
      <SnackbarProvider>
        <QuotePage />
      </SnackbarProvider>
    </MemoryRouter>,
  );
  return { user: userEvent.setup(), weight: screen.getByLabelText('Peso del paquete') };
}

describe('QuotePage (caja negra en la UI)', () => {
  beforeEach(() => {
    quote.mockReset();
    getRules.mockReset().mockRejectedValue(new Error('sin reglas'));
  });

  it('UI-01 campo vacío: no cotiza y muestra el estado inicial', () => {
    renderPage();

    expect(screen.getByText('Tu tarifa aparecerá aquí')).toBeInTheDocument();
    expect(quote).not.toHaveBeenCalled();
  });

  it('UI-02 peso válido (con coma decimal): muestra el total calculado', async () => {
    quote.mockImplementation(async (shipment: Shipment) => quoteFor(shipment, 12));
    const { user, weight } = renderPage();

    await user.type(weight, '3,5');

    expect(await screen.findByText('Total a pagar')).toBeInTheDocument();
    expect(screen.getAllByText('$12.00').length).toBeGreaterThan(0);
    expect(quote).toHaveBeenLastCalledWith(
      { weightKg: 3.5, customerType: 'NUEVO', shippingType: 'ESTANDAR' },
      expect.any(AbortSignal),
    );
  });

  it('UI-03 peso no numérico: error en el campo sin llamar al backend', async () => {
    const { user, weight } = renderPage();

    await user.type(weight, 'abc');

    expect(screen.getByText(/Ingresa un peso válido/)).toBeInTheDocument();
    expect(weight).toHaveAttribute('aria-invalid', 'true');
    expect(quote).not.toHaveBeenCalled();
  });

  it('UI-04 peso por encima del límite: muestra el rechazo del envío', async () => {
    quote.mockRejectedValue(
      new ApiError(422, 'WEIGHT_LIMIT_EXCEEDED', 'Envío rechazado: el peso (25 kg) supera el límite permitido de 20.00 kg.'),
    );
    const { user, weight } = renderPage();

    await user.type(weight, '25');

    expect(await screen.findByText('Límite de peso excedido')).toBeInTheDocument();
    expect(screen.queryByText('Total a pagar')).not.toBeInTheDocument();
  });

  it('UI-05 peso por debajo del mínimo: muestra el mensaje del backend en el campo', async () => {
    quote.mockRejectedValue(
      new ApiError(400, 'INVALID_WEIGHT', 'El peso mínimo es 0.01 kg.', [
        { field: 'weightKg', message: 'El peso mínimo es 0.01 kg.' },
      ]),
    );
    const { user, weight } = renderPage();

    await user.type(weight, '0');

    expect(await screen.findByText('El peso mínimo es 0.01 kg.')).toBeInTheDocument();
  });

  it('UI-06 cambiar cliente y envío vuelve a cotizar con la nueva combinación', async () => {
    quote.mockImplementation(async (shipment: Shipment) => quoteFor(shipment, 10));
    const { user, weight } = renderPage();

    await user.type(weight, '10');
    await user.click(screen.getByRole('radio', { name: 'VIP' }));
    await user.click(screen.getByRole('radio', { name: 'Express' }));

    await vi.waitFor(() =>
      expect(quote).toHaveBeenLastCalledWith(
        { weightKg: 10, customerType: 'VIP', shippingType: 'EXPRESS' },
        expect.any(AbortSignal),
      ),
    );
  });
});
