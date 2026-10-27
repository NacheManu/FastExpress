import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SnackbarProvider } from '../../core/feedback/SnackbarProvider';
import type { PricingRules, Quote } from '../../models/pricing';
import type { Shipment } from '../../models/shipment';
import { ApiError } from '../../services/httpClient';
import { buildOrder } from '../../test/orderTestData';
import { QuotePage } from './QuotePage';

/**
 * Caja negra desde la interfaz: se simula el backend y se comprueba lo que ve el usuario
 * para cada partición del campo Peso.
 */
const { quote, getRules, createOrder } = vi.hoisted(() => ({
  quote: vi.fn(),
  getRules: vi.fn(),
  createOrder: vi.fn(),
}));
vi.mock('../../services/pricingService', () => ({ pricingService: { quote, getRules } }));
vi.mock('../../services/orderService', () => ({
  orderService: { list: vi.fn(), get: vi.fn(), create: createOrder },
}));

const RULES: PricingRules = {
  currency: 'USD',
  baseFee: 5,
  minWeightKg: 0.01,
  maxWeightKg: 20,
  weightTiers: [
    { minKg: 0.01, maxKg: 5, ratePerKg: 2 },
    { minKg: 5.01, maxKg: 20, ratePerKg: 4 },
  ],
  customerDiscountPercent: { NUEVO: 0, FRECUENTE: 10, VIP: 20 },
  shippingSurchargePercent: { ESTANDAR: 0, EXPRESS: 25 },
};

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
        <Routes>
          <Route path="/" element={<QuotePage />} />
          <Route path="/ordenes/:orderId" element={<p>Detalle de la orden</p>} />
        </Routes>
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

describe('QuotePage: crear orden, tarifas y estados', () => {
  beforeEach(() => {
    quote.mockReset().mockImplementation(async (shipment: Shipment) => quoteFor(shipment, 45));
    getRules.mockReset().mockResolvedValue(RULES);
    createOrder.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('UI-07 crea la orden, limpia el formulario y permite abrirla desde el aviso', async () => {
    createOrder.mockImplementation(async (input) => buildOrder({ customerName: input.customerName }));
    const { user, weight } = renderPage();

    await user.type(weight, '10');
    const submit = await screen.findByRole('button', { name: /Crear orden/ });

    await user.click(submit);
    expect(screen.getByText('Ingresa el nombre del cliente.')).toBeInTheDocument();
    expect(createOrder).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Nombre del cliente'), 'Ana Pérez');
    await user.click(submit);

    expect(createOrder).toHaveBeenCalledWith({
      weightKg: 10,
      customerType: 'NUEVO',
      shippingType: 'ESTANDAR',
      customerName: 'Ana Pérez',
    });
    expect(await screen.findByText('Orden #3F2A9C1E creada para Ana Pérez.')).toBeInTheDocument();
    expect(weight).toHaveValue('');

    await user.click(screen.getByRole('button', { name: 'Ver orden' }));
    expect(screen.getByText('Detalle de la orden')).toBeInTheDocument();
  });

  it('UI-08 informa si el backend no puede crear la orden', async () => {
    createOrder.mockRejectedValue(new ApiError(500, 'INTERNAL_ERROR', 'Ha ocurrido un error inesperado.'));
    const { user, weight } = renderPage();

    await user.type(weight, '10');
    await user.type(await screen.findByLabelText('Nombre del cliente'), 'Ana');
    await user.click(screen.getByRole('button', { name: /Crear orden/ }));

    expect(await screen.findByText('Ha ocurrido un error inesperado.')).toBeInTheDocument();
  });

  it('UI-09 muestra el error de conexión al cotizar y permite reintentar', async () => {
    quote.mockRejectedValueOnce(new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor.'));
    const { user, weight } = renderPage();

    await user.type(weight, '3');
    expect(await screen.findByText('No se pudo calcular la tarifa')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Reintentar/ }));

    expect(await screen.findByText('Total a pagar')).toBeInTheDocument();
  });

  it('UI-10 indica que está calculando mientras espera al backend', async () => {
    quote.mockReturnValue(new Promise(() => {}));
    const { user, weight } = renderPage();

    await user.type(weight, '3');

    expect(await screen.findByText('Calculando tarifa…')).toBeInTheDocument();
  });

  it('UI-11 explica el efecto del cliente y el envío y permite limpiar el formulario', async () => {
    const { user, weight } = renderPage();

    expect(await screen.findByText('Entre 0.01 kg y 20 kg, con hasta 2 decimales.')).toBeInTheDocument();
    expect(screen.getByText('Sin descuento')).toBeInTheDocument();
    expect(screen.getByText('Sin recargo')).toBeInTheDocument();

    await user.type(weight, '2');
    await user.click(screen.getByRole('radio', { name: 'VIP' }));
    await user.click(screen.getByRole('radio', { name: 'Express' }));
    expect(screen.getByText('20% de descuento sobre el subtotal')).toBeInTheDocument();
    expect(screen.getByText('+25% de recargo sobre el subtotal')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Limpiar/ }));
    expect(weight).toHaveValue('');
    expect(screen.getByRole('radio', { name: 'Nuevo' })).toBeChecked();
    expect(screen.queryByRole('button', { name: /Limpiar/ })).not.toBeInTheDocument();
  });

  it('UI-12 despliega las tarifas vigentes que expone el backend', async () => {
    const { user } = renderPage();
    const toggle = screen.getByRole('button', { name: /Tarifas vigentes/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByText('Por orden')).toBeInTheDocument();
    expect(screen.getByText('$4.00/kg')).toBeInTheDocument();
    expect(screen.getByText('No se admite')).toBeInTheDocument();
    expect(screen.getByText('+25%')).toBeInTheDocument();
  });

  it('UI-13 avisa si no se pudieron cargar las tarifas', async () => {
    getRules.mockRejectedValue(new Error('sin backend'));
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: /Tarifas vigentes/ }));

    expect(await screen.findByText(/No se pudieron cargar las tarifas/)).toBeInTheDocument();
  });

  it('UI-14 muestra el progreso mientras se cargan las tarifas', async () => {
    getRules.mockReturnValue(new Promise(() => {}));
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: /Tarifas vigentes/ }));

    expect(screen.getByRole('progressbar', { name: 'Cargando tarifas' })).toBeInTheDocument();
  });

  it('UI-15 en móvil muestra la barra con el total si el resumen no está a la vista', async () => {
    let report: (entries: { isIntersecting: boolean }[]) => void = () => {};
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof report) {
          report = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
    const { user, weight } = renderPage();

    await user.type(weight, '10');
    await screen.findByText('Total a pagar');
    act(() => report([{ isIntersecting: false }]));

    await user.click(screen.getByRole('button', { name: /Ver desglose/ }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });
});
