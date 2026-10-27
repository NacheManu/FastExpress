import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PriceBreakdownList } from './PriceBreakdownList';

describe('PriceBreakdownList', () => {
  it('muestra cada concepto de la tarifa formateado en dólares', () => {
    render(
      <PriceBreakdownList
        currency="USD"
        shipment={{ weightKg: 10, customerType: 'VIP', shippingType: 'EXPRESS' }}
        breakdown={{
          baseFee: 5,
          weightTier: { minKg: 5.01, maxKg: 20, ratePerKg: 4 },
          weightCharge: 40,
          subtotal: 45,
          discountPercent: 20,
          discount: 9,
          surchargePercent: 25,
          surcharge: 11.25,
          total: 47.25,
        }}
      />,
    );

    expect(screen.getByText('10 kg × $4.00/kg')).toBeInTheDocument();
    expect(screen.getByText('$40.00')).toBeInTheDocument();
    expect(screen.getByText('Descuento cliente VIP')).toBeInTheDocument();
    expect(screen.getByText('−$9.00')).toBeInTheDocument();
    expect(screen.getByText('+$11.25')).toBeInTheDocument();
    expect(screen.getByText('$47.25')).toBeInTheDocument();
  });
});
