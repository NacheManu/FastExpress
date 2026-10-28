import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PriceBreakdownList } from './PriceBreakdownList';

describe('PriceBreakdownList', () => {
  it('muestra cada concepto de la tarifa, con el recargo sobre el subtotal con descuento', () => {
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
          subtotalAfterDiscount: 36,
          surchargePercent: 25,
          surcharge: 9,
          total: 45,
        }}
      />,
    );

    expect(screen.getByText('10 kg × $4.00/kg')).toBeInTheDocument();
    expect(screen.getByText('$40.00')).toBeInTheDocument();
    expect(screen.getByText('Descuento cliente VIP')).toBeInTheDocument();
    expect(screen.getByText('−$9.00')).toBeInTheDocument();
    expect(screen.getByText('Subtotal con descuento').closest('div')).toHaveTextContent('$36.00');
    expect(screen.getByText('+25% del subtotal con descuento')).toBeInTheDocument();
    expect(screen.getByText('+$9.00')).toBeInTheDocument();
    expect(screen.getByText('Total').closest('div')).toHaveTextContent('$45.00');
  });
});
