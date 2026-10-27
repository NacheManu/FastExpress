import type { ReactNode, Ref } from 'react';
import { formatCurrency, formatWeight } from '../../core/format';
import type { Quote } from '../../models/pricing';
import {
  CUSTOMER_TYPE_ICONS,
  CUSTOMER_TYPE_LABELS,
  SHIPPING_TYPE_ICONS,
  SHIPPING_TYPE_LABELS,
} from '../../models/shipment';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { cn } from '../../ui/cn';
import { Icon } from '../../ui/Icon';
import { LinearProgress } from '../../ui/LinearProgress';
import { PriceBreakdownList } from './PriceBreakdownList';

interface QuoteSummaryProps {
  quote: Quote | null;
  isQuoting: boolean;
  rejection: string | null;
  error: string | null;
  onRetry: () => void;
  /** Acciones bajo el desglose (p. ej. crear la orden). */
  children?: ReactNode;
  className?: string;
  ref?: Ref<HTMLElement>;
}

export function QuoteSummary({
  quote,
  isQuoting,
  rejection,
  error,
  onRetry,
  children,
  className,
  ref,
}: QuoteSummaryProps) {
  let content: ReactNode;
  if (rejection) {
    content = (
      <StatusPanel icon="block" title="Límite de peso excedido" tone="error">
        <p>{rejection}</p>
        <p className="mt-2">Reduce el peso o divide el contenido en varios envíos.</p>
      </StatusPanel>
    );
  } else if (error) {
    content = (
      <StatusPanel icon="cloud_off" title="No se pudo calcular la tarifa" tone="error">
        <p>{error}</p>
        <Button icon="refresh" className="mt-4" onClick={onRetry}>
          Reintentar
        </Button>
      </StatusPanel>
    );
  } else if (quote) {
    content = (
      <>
        <QuoteTotal quote={quote} isQuoting={isQuoting} />
        <div className={cn('rounded-xl bg-surface-container-low px-5 py-3 transition-opacity', isQuoting && 'opacity-60')}>
          <h3 className="type-title-small pt-2 text-on-surface-variant">Desglose</h3>
          <PriceBreakdownList shipment={quote.shipment} breakdown={quote.breakdown} currency={quote.currency} />
        </div>
        {children}
      </>
    );
  } else if (isQuoting) {
    content = (
      <StatusPanel icon="calculate" title="Calculando tarifa…">
        <LinearProgress label="Calculando tarifa" className="mt-2" />
      </StatusPanel>
    );
  } else {
    content = (
      <StatusPanel icon="package_2" title="Tu tarifa aparecerá aquí">
        <p>Ingresa el peso del paquete y elige el tipo de cliente y de envío.</p>
      </StatusPanel>
    );
  }

  return (
    <section
      ref={ref}
      aria-label="Resumen de la tarifa"
      aria-busy={isQuoting}
      className={cn('flex scroll-mt-20 flex-col gap-4', className)}
    >
      <div aria-live="polite" className="contents">
        {content}
      </div>
    </section>
  );
}

function QuoteTotal({ quote, isQuoting }: { quote: Quote; isQuoting: boolean }) {
  const { shipment, breakdown, currency } = quote;

  return (
    <div className="animate-enter overflow-hidden rounded-xl bg-primary-container text-on-primary-container">
      {isQuoting ? <LinearProgress label="Recalculando tarifa" className="rounded-none" /> : <div className="h-1" />}
      <div className={cn('p-6 transition-opacity', isQuoting && 'opacity-60')}>
        <p className="type-label-large">Total a pagar</p>
        <p className="type-display-small mt-1 font-medium tabular-nums">{formatCurrency(breakdown.total, currency)}</p>
        {breakdown.discount > 0 && (
          <p className="type-body-medium mt-1">Ahorras {formatCurrency(breakdown.discount, currency)}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip icon="scale" label={formatWeight(shipment.weightKg)} />
          <Chip icon={CUSTOMER_TYPE_ICONS[shipment.customerType]} label={CUSTOMER_TYPE_LABELS[shipment.customerType]} />
          <Chip icon={SHIPPING_TYPE_ICONS[shipment.shippingType]} label={SHIPPING_TYPE_LABELS[shipment.shippingType]} />
        </div>
      </div>
    </div>
  );
}

function StatusPanel({
  icon,
  title,
  tone = 'neutral',
  children,
}: {
  icon: string;
  title: string;
  tone?: 'neutral' | 'error';
  children: ReactNode;
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl px-6 py-10 text-center',
        tone === 'error'
          ? 'bg-error-container text-on-error-container'
          : 'border border-dashed border-outline-variant text-on-surface',
      )}
    >
      <span
        className={cn(
          'flex size-14 items-center justify-center rounded-full',
          tone === 'error' ? 'bg-error text-on-error' : 'bg-secondary-container text-on-secondary-container',
        )}
      >
        <Icon name={icon} size={28} />
      </span>
      <p className="type-title-medium">{title}</p>
      <div className={cn('type-body-medium w-full', tone === 'neutral' && 'text-on-surface-variant')}>{children}</div>
    </div>
  );
}
