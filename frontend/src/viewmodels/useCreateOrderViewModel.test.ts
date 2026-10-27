import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Shipment } from '../models/shipment';
import { ApiError } from '../services/httpClient';
import { fakeOrderService } from '../test/orderTestData';
import { useCreateOrderViewModel } from './useCreateOrderViewModel';

const SHIPMENT: Shipment = { weightKg: 3, customerType: 'FRECUENTE', shippingType: 'ESTANDAR' };

describe('useCreateOrderViewModel', () => {
  it('exige el nombre del cliente antes de llamar al backend', async () => {
    const service = fakeOrderService();
    const { result } = renderHook(() => useCreateOrderViewModel({ orderService: service }));

    let order: unknown;
    await act(async () => {
      order = await result.current.submit(SHIPMENT);
    });

    expect(order).toBeNull();
    expect(result.current.nameError).toBe('Ingresa el nombre del cliente.');
    expect(service.create).not.toHaveBeenCalled();
  });

  it('crea la orden con el envío cotizado y limpia el formulario', async () => {
    const service = fakeOrderService();
    const { result } = renderHook(() => useCreateOrderViewModel({ orderService: service }));

    act(() => result.current.setCustomerName('  Ana Pérez '));
    let order: unknown;
    await act(async () => {
      order = await result.current.submit(SHIPMENT);
    });

    expect(service.create).toHaveBeenCalledWith({ ...SHIPMENT, customerName: 'Ana Pérez' });
    expect(order).toMatchObject({ customerName: 'Ana Pérez' });
    expect(result.current.customerName).toBe('');
    expect(result.current.isSubmitting).toBe(false);
  });

  it('muestra en el campo el error de validación del backend', async () => {
    const service = fakeOrderService();
    service.create.mockRejectedValueOnce(
      new ApiError(400, 'VALIDATION_ERROR', 'La petición contiene datos inválidos.', [
        { field: 'customerName', message: 'El nombre del cliente admite como máximo 100 caracteres.' },
      ]),
    );
    const { result } = renderHook(() => useCreateOrderViewModel({ orderService: service }));

    act(() => result.current.setCustomerName('x'.repeat(101)));
    await act(async () => {
      await result.current.submit(SHIPMENT);
    });

    expect(result.current.nameError).toBe('El nombre del cliente admite como máximo 100 caracteres.');
    expect(result.current.submitError).toBeNull();
  });
});

describe('useCreateOrderViewModel: errores del envío', () => {
  it.each([
    ['un error inesperado', new Error('caída'), 'No se pudo crear la orden. Inténtalo de nuevo.'],
    ['un error de la API sin detalle del nombre', new ApiError(500, 'INTERNAL_ERROR', 'Error del servidor.'), 'Error del servidor.'],
  ])('muestra un mensaje general ante %s', async (_caso, failure, message) => {
    const service = fakeOrderService();
    service.create.mockRejectedValueOnce(failure);
    const { result } = renderHook(() => useCreateOrderViewModel({ orderService: service }));

    act(() => result.current.setCustomerName('Ana'));
    await act(async () => {
      await result.current.submit(SHIPMENT);
    });

    expect(result.current.submitError).toBe(message);
    expect(result.current.nameError).toBeNull();
    expect(result.current.customerName).toBe('Ana');
  });
});
