import { Link } from 'react-router';
import { formatCurrency, formatDateTime, formatWeight } from '../../core/format';
import { formatOrderNumber, type Order } from '../../models/order';
import { CUSTOMER_TYPE_LABELS, SHIPPING_TYPE_ICONS, SHIPPING_TYPE_LABELS } from '../../models/shipment';
import { cn } from '../../ui/cn';
import { Icon } from '../../ui/Icon';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

/** Elemento de lista de M3 (tres líneas) para una orden. */
export function OrderListItem({ order }: { order: Order }) {
  const { shipment } = order;
  const isExpress = shipment.shippingType === 'EXPRESS';

  return (
    <li>
      <Link
        to={`/ordenes/${order.id}`}
        className="state-layer flex items-center gap-4 px-4 py-3 focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-secondary"
      >
        <span
          aria-hidden="true"
          className="type-title-medium flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container"
        >
          {initials(order.customerName)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="type-body-large block truncate text-on-surface">{order.customerName}</span>
          <span className="type-body-medium block truncate text-on-surface-variant">
            {formatOrderNumber(order.id)} · {formatDateTime(order.createdAt)}
          </span>
          <span className="type-body-medium mt-0.5 flex flex-wrap items-center gap-x-2 text-on-surface-variant">
            <span>{formatWeight(shipment.weightKg)}</span>
            <span aria-hidden="true">·</span>
            <span>Cliente {CUSTOMER_TYPE_LABELS[shipment.customerType]}</span>
            <span aria-hidden="true">·</span>
            <span className={cn('inline-flex items-center gap-1', isExpress && 'text-tertiary')}>
              <Icon name={SHIPPING_TYPE_ICONS[shipment.shippingType]} size={16} filled={isExpress} />
              {SHIPPING_TYPE_LABELS[shipment.shippingType]}
            </span>
          </span>
        </span>

        <span className="type-title-medium shrink-0 tabular-nums text-on-surface">
          {formatCurrency(order.breakdown.total, order.currency)}
        </span>
        <Icon name="chevron_right" className="hidden text-on-surface-variant medium:inline-block" />
      </Link>
    </li>
  );
}
