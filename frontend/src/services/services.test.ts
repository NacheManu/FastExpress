import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, http } from './httpClient';
import { orderService } from './orderService';
import { pricingService } from './pricingService';

const fetchMock = vi.fn();

/** Respuesta mínima de fetch; `body` = undefined simula un cuerpo que no es JSON. */
const response = (status: number, body?: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => {
    if (body === undefined) throw new SyntaxError('Unexpected token');
    return body;
  },
});

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('http', () => {
  it('GET: llama a /api/v1 y devuelve el JSON', async () => {
    fetchMock.mockResolvedValue(response(200, { ok: true }));

    await expect(http.get('/recurso')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/recurso', {
      signal: undefined,
      headers: { Accept: 'application/json' },
    });
  });

  it('POST: envía el cuerpo como JSON', async () => {
    fetchMock.mockResolvedValue(response(201, { id: 1 }));
    const controller = new AbortController();

    await http.post('/recurso', { a: 1 }, controller.signal);

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/recurso', {
      method: 'POST',
      body: '{"a":1}',
      signal: controller.signal,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });
  });

  it('convierte el error de la API en un ApiError con su código y detalles', async () => {
    const details = [{ field: 'weightKg', message: 'El peso mínimo es 0.01 kg.' }];
    fetchMock.mockResolvedValue(response(400, { error: { code: 'INVALID_WEIGHT', message: 'Peso inválido', details } }));

    const error = await http.get('/x').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'INVALID_WEIGHT', message: 'Peso inválido', details });
  });

  it('usa un mensaje genérico si la respuesta de error no tiene el formato de la API', async () => {
    fetchMock.mockResolvedValue(response(502));

    await expect(http.get('/x')).rejects.toMatchObject({
      status: 502,
      code: 'HTTP_ERROR',
      message: 'El servidor respondió con un error (502).',
      details: [],
    });
  });

  it('traduce un fallo de red a NETWORK_ERROR', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(http.get('/x')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('propaga la cancelación de la petición sin transformarla', async () => {
    const abort = new DOMException('The operation was aborted.', 'AbortError');
    fetchMock.mockRejectedValue(abort);

    await expect(http.get('/x')).rejects.toBe(abort);
  });
});

describe('servicios', () => {
  it('pricingService usa los endpoints de tarifas', async () => {
    fetchMock.mockResolvedValue(response(200, {}));
    const shipment = { weightKg: 1, customerType: 'NUEVO', shippingType: 'ESTANDAR' } as const;

    await pricingService.getRules();
    await pricingService.quote(shipment);

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method ?? 'GET'])).toEqual([
      ['/api/v1/pricing/rules', 'GET'],
      ['/api/v1/pricing/quote', 'POST'],
    ]);
  });

  it('orderService lista, obtiene y crea órdenes', async () => {
    fetchMock.mockResolvedValueOnce(response(200, { data: [{ id: 'a' }] }));
    fetchMock.mockResolvedValueOnce(response(200, { id: 'a b' }));
    fetchMock.mockResolvedValueOnce(response(201, { id: 'c' }));

    await expect(orderService.list()).resolves.toEqual([{ id: 'a' }]);
    await orderService.get('a b');
    await orderService.create({ customerName: 'Ana', weightKg: 1, customerType: 'VIP', shippingType: 'EXPRESS' });

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method ?? 'GET'])).toEqual([
      ['/api/v1/orders', 'GET'],
      ['/api/v1/orders/a%20b', 'GET'],
      ['/api/v1/orders', 'POST'],
    ]);
  });
});
