import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PricingRules, Quote } from '../models/pricing';
import type { Shipment } from '../models/shipment';
import { ApiError } from '../services/httpClient';
import type { PricingService } from '../services/pricingService';
import { useQuoteViewModel } from './useQuoteViewModel';

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

const quoteFor = (shipment: Shipment): Quote => ({
  shipment,
  currency: 'USD',
  breakdown: {
    baseFee: 5,
    weightTier: RULES.weightTiers[0]!,
    weightCharge: shipment.weightKg * 2,
    subtotal: 5 + shipment.weightKg * 2,
    discountPercent: 0,
    discount: 0,
    subtotalAfterDiscount: 5 + shipment.weightKg * 2,
    surchargePercent: 0,
    surcharge: 0,
    total: 5 + shipment.weightKg * 2,
  },
});

function fakeService(quote: PricingService['quote'] = async (shipment) => quoteFor(shipment)) {
  return {
    getRules: vi.fn(async () => RULES),
    quote: vi.fn(quote),
  } satisfies PricingService;
}

const setup = (service: PricingService) =>
  renderHook(() => useQuoteViewModel({ pricingService: service, debounceMs: 0 }));

describe('useQuoteViewModel', () => {
  it('carga las reglas y no cotiza hasta tener un peso', async () => {
    const service = fakeService();
    const { result } = setup(service);

    await waitFor(() => expect(result.current.rules).toEqual(RULES));
    expect(result.current.quote).toBeNull();
    expect(result.current.isQuoting).toBe(false);
    expect(service.quote).not.toHaveBeenCalled();
  });

  it('cotiza con los datos del formulario', async () => {
    const service = fakeService();
    const { result } = setup(service);

    act(() => {
      result.current.setWeight('2,5');
      result.current.setCustomerType('VIP');
      result.current.setShippingType('EXPRESS');
    });

    expect(result.current.isQuoting).toBe(true);
    await waitFor(() => expect(result.current.quote?.breakdown.total).toBe(10));
    expect(result.current.isQuoting).toBe(false);
    expect(service.quote).toHaveBeenLastCalledWith(
      { weightKg: 2.5, customerType: 'VIP', shippingType: 'EXPRESS' },
      expect.any(AbortSignal),
    );
  });

  it('marca un error de formato sin llamar al backend', async () => {
    const service = fakeService();
    const { result } = setup(service);

    act(() => result.current.setWeight('abc'));

    await waitFor(() => expect(result.current.weightError).toMatch(/peso válido/));
    expect(result.current.isQuoting).toBe(false);
    expect(service.quote).not.toHaveBeenCalled();
  });

  it.each([
    ['25', 'El peso máximo permitido es 20 kg. Reduce el peso e inténtalo de nuevo.'],
    ['0', 'El peso mínimo es 0.01 kg.'],
    ['2.555', 'El peso admite como máximo 2 decimales.'],
  ])('valida en el cliente el peso "%s" con los límites de BR-02, sin llamar al backend', async (weight, message) => {
    const service = fakeService();
    const { result } = setup(service);
    await waitFor(() => expect(result.current.rules).not.toBeNull());

    act(() => result.current.setWeight(weight));

    await waitFor(() => expect(result.current.weightError).toBe(message));
    expect(result.current.quote).toBeNull();
    expect(service.quote).not.toHaveBeenCalled();
  });

  it('no muestra el error del cliente hasta que el usuario deja de escribir', async () => {
    const service = fakeService();
    const { result } = renderHook(() => useQuoteViewModel({ pricingService: service, debounceMs: 50 }));
    await waitFor(() => expect(result.current.rules).not.toBeNull());

    act(() => result.current.setWeight('0'));
    expect(result.current.weightError).toBeNull();

    act(() => result.current.setWeight('0.5'));
    await waitFor(() => expect(result.current.quote?.breakdown.total).toBe(6));
    expect(result.current.weightError).toBeNull();
  });

  it('sin reglas disponibles, muestra en el campo el rechazo 422 del backend', async () => {
    const message = 'El peso máximo permitido es 20 kg. Reduce el peso e inténtalo de nuevo.';
    const service = fakeService(async () => {
      throw new ApiError(422, 'WEIGHT_LIMIT_EXCEEDED', message, [{ field: 'weightKg', message }]);
    });
    service.getRules.mockRejectedValueOnce(new Error('sin backend'));
    const { result } = setup(service);
    await waitFor(() => expect(result.current.rulesFailed).toBe(true));

    act(() => result.current.setWeight('25'));

    await waitFor(() => expect(result.current.weightError).toBe(message));
    expect(result.current.quote).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('un error de la API sin detalle del peso se muestra como error general', async () => {
    const service = fakeService(async () => {
      throw new ApiError(422, 'INVALID_CUSTOMER_TYPE', 'Tipo de cliente desconocido.', [
        { field: 'customerType', message: 'Tipo de cliente desconocido.' },
      ]);
    });
    const { result } = setup(service);

    act(() => result.current.setWeight('3'));

    await waitFor(() => expect(result.current.error).toBe('Tipo de cliente desconocido.'));
    expect(result.current.weightError).toBeNull();
  });

  it('permite reintentar tras un error de red', async () => {
    const service = fakeService();
    service.quote.mockRejectedValueOnce(new ApiError(0, 'NETWORK_ERROR', 'Sin conexión.'));
    const { result } = setup(service);

    act(() => result.current.setWeight('1'));
    await waitFor(() => expect(result.current.error).toBe('Sin conexión.'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.quote?.breakdown.total).toBe(7));
    expect(result.current.error).toBeNull();
    expect(service.quote).toHaveBeenCalledTimes(2);
  });
});

describe('useQuoteViewModel: errores inesperados', () => {
  it('usa un mensaje general si el fallo no viene de la API', async () => {
    const service = fakeService(async () => {
      throw new Error('caída');
    });
    const { result } = setup(service);

    act(() => result.current.setWeight('1'));

    await waitFor(() => expect(result.current.error).toBe('No se pudo calcular la tarifa. Inténtalo de nuevo.'));
  });

  it('marca las tarifas como no disponibles si no se pueden cargar', async () => {
    const service = fakeService();
    service.getRules.mockRejectedValueOnce(new Error('sin backend'));
    const { result } = setup(service);

    await waitFor(() => expect(result.current.rulesFailed).toBe(true));
    expect(result.current.rules).toBeNull();
  });
});
