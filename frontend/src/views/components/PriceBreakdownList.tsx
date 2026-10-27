import type { ReactNode } from 'react';
import { formatCurrency, formatPercent, formatWeight } from '../../core/format';
import type { PriceBreakdown } from '../../models/pricing';
import { CUSTOMER_TYPE_LABELS, SHIPPING_TYPE_LABELS, type Shipment } from '../../models/shipment';
import { cn } from '../../ui/cn';

interface PriceBreakdownListProps {
  shipment: Shipment;
  breakdown: PriceBreakdown;
  currency: string;
  className?: string;
}

function Row({ label, hint, value, strong }: { label: string; hint?: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="min-w-0">
        <span className={strong ? 'type-title-medium' : 'type-body-large'}>{label}</span>
        {hint && <span className="type-body-small block text-on-surface-variant">{hint}</span>}
      </dt>
      <dd className={cn('shrink-0 tabular-nums', strong ? 'type-title-medium' : 'type-body-large')}>{value}</dd>
    </div>
  );
}

const Divider = () => <div role="separator" className="my-1 h-px bg-outline-variant" />;

/** Desglose de la tarifa (BR-01 a BR-04) tal como lo calcula el backend. */
export function PriceBreakdownList({ shipment, breakdown, currency, className }: PriceBreakdownListProps) {
  const money = (amount: number) => formatCurrency(amount, currency);

  return (
    <dl className={className}>
      <Row label="Tarifa base" hint="Cargo fijo por orden" value={money(breakdown.baseFee)} />
      <Row
        label="Peso"
        hint={`${formatWeight(shipment.weightKg)} × ${money(breakdown.weightTier.ratePerKg)}/kg`}
        value={money(breakdown.weightCharge)}
      />
      <Divider />
      <Row label="Subtotal" value={money(breakdown.subtotal)} />
      <Row
        label={`Descuento cliente ${CUSTOMER_TYPE_LABELS[shipment.customerType]}`}
        hint={breakdown.discountPercent > 0 ? `${formatPercent(breakdown.discountPercent)} del subtotal` : 'Sin descuento'}
        value={
          <span className={breakdown.discount > 0 ? 'text-tertiary' : undefined}>
            {breakdown.discount > 0 ? `−${money(breakdown.discount)}` : money(0)}
          </span>
        }
      />
      <Row
        label={`Recargo envío ${SHIPPING_TYPE_LABELS[shipment.shippingType]}`}
        hint={
          breakdown.surchargePercent > 0 ? `+${formatPercent(breakdown.surchargePercent)} del subtotal` : 'Sin recargo'
        }
        value={breakdown.surcharge > 0 ? `+${money(breakdown.surcharge)}` : money(0)}
      />
      <Divider />
      <Row label="Total" value={money(breakdown.total)} strong />
    </dl>
  );
}
