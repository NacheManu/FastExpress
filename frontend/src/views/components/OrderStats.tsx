import { formatCurrency } from '../../core/format';
import { Icon } from '../../ui/Icon';

interface OrderStatsProps {
  count: number;
  expressCount: number;
  revenue: number;
  averageTicket: number;
  currency: string;
}

export function OrderStats({ count, expressCount, revenue, averageTicket, currency }: OrderStatsProps) {
  const stats = [
    { icon: 'inventory_2', label: 'Órdenes', value: String(count), hint: `${expressCount} express` },
    { icon: 'payments', label: 'Facturado', value: formatCurrency(revenue, currency), hint: 'Suma de totales' },
    { icon: 'receipt', label: 'Ticket promedio', value: formatCurrency(averageTicket, currency), hint: 'Por orden' },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 medium:grid-cols-3">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={
            index === 0
              ? 'col-span-2 rounded-xl bg-tertiary-container p-4 text-on-tertiary-container medium:col-span-1'
              : 'rounded-xl bg-surface-container-low p-4'
          }
        >
          <dt className="type-label-large flex items-center gap-2 opacity-80">
            <Icon name={stat.icon} size={18} />
            {stat.label}
          </dt>
          <dd className="type-headline-small mt-2 truncate tabular-nums">{stat.value}</dd>
          <dd className="type-body-small mt-0.5 opacity-80">{stat.hint}</dd>
        </div>
      ))}
    </dl>
  );
}
