import { describe, expect, it } from 'vitest';
import { UnknownCustomerTypeError, UnknownShippingTypeError } from '../../src/domain/errors.js';
import { toShipment } from '../../src/domain/pricing/shipment.js';

describe('toShipment', () => {
  it('acepta los tipos de cliente y de envío admitidos', () => {
    expect(toShipment({ weightKg: 3, customerType: 'VIP', shippingType: 'EXPRESS' })).toEqual({
      weightKg: 3,
      customerType: 'VIP',
      shippingType: 'EXPRESS',
    });
  });

  it('rechaza un tipo de cliente desconocido indicando el campo', () => {
    const act = () => toShipment({ weightKg: 3, customerType: 'GOLD', shippingType: 'EXPRESS' });

    expect(act).toThrow(UnknownCustomerTypeError);
    expect(act).toThrow(expect.objectContaining({ field: 'customerType', code: 'INVALID_CUSTOMER_TYPE' }));
  });

  it('rechaza un tipo de envío desconocido indicando el campo', () => {
    const act = () => toShipment({ weightKg: 3, customerType: 'VIP', shippingType: 'NORMAL' });

    expect(act).toThrow(UnknownShippingTypeError);
    expect(act).toThrow(expect.objectContaining({ field: 'shippingType', code: 'INVALID_SHIPPING_TYPE' }));
  });
});
