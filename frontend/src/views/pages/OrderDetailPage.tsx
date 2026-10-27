import { Link, useNavigate, useParams } from 'react-router';
import { formatCurrency, formatDateTime, formatWeight } from '../../core/format';
import { formatOrderNumber, type Order } from '../../models/order';
import {
  CUSTOMER_TYPE_ICONS,
  CUSTOMER_TYPE_LABELS,
  SHIPPING_TYPE_ICONS,
  SHIPPING_TYPE_LABELS,
} from '../../models/shipment';
import { Button, buttonClasses } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { LinearProgress } from '../../ui/LinearProgress';
import { useOrderDetailViewModel } from '../../viewmodels/useOrderDetailViewModel';
import { PriceBreakdownList } from '../components/PriceBreakdownList';

export function OrderDetailPage() {
  const { orderId = '' } = useParams();
  // La key reinicia el estado al navegar entre órdenes distintas.
  return <OrderDetail key={orderId} orderId={orderId} />;
}

function OrderDetail({ orderId }: { orderId: string }) {
  const vm = useOrderDetailViewModel(orderId);
  const navigate = useNavigate();

  return (
    <>
      <div className="flex items-center gap-2 py-4 medium:py-6">
        <IconButton icon="arrow_back" label="Volver a órdenes" onClick={() => navigate('/ordenes')} />
        <h1 className="type-headline-small expanded:type-headline-medium">
          {vm.status === 'ready' ? `Orden ${formatOrderNumber(vm.order.id)}` : 'Detalle de la orden'}
        </h1>
      </div>

      {vm.status === 'loading' && (
        <div className="rounded-xl bg-surface-container-low p-6">
          <LinearProgress label="Cargando orden" />
        </div>
      )}

      {vm.status === 'not-found' && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline-variant px-6 py-16 text-center">
          <Icon name="search_off" size={40} className="text-on-surface-variant" />
          <p className="type-title-medium">Orden no encontrada</p>
          <p className="type-body-medium text-on-surface-variant">
            Puede que el servidor se haya reiniciado: las órdenes se guardan en memoria.
          </p>
          <Link to="/ordenes" className={buttonClasses('tonal')}>
            Ver todas las órdenes
          </Link>
        </div>
      )}

      {vm.status === 'error' && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-xl bg-error-container px-6 py-10 text-center text-on-error-container">
          <Icon name="cloud_off" size={32} />
          <p className="type-body-medium">{vm.message}</p>
          <Button icon="refresh" onClick={vm.retry}>
            Reintentar
          </Button>
        </div>
      )}

      {vm.status === 'ready' && <OrderDetailContent order={vm.order} />}
    </>
  );
}

function OrderDetailContent({ order }: { order: Order }) {
  const { shipment, breakdown, currency } = order;

  return (
    <div className="grid animate-enter gap-6 expanded:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] expanded:items-start">
      <div className="rounded-xl bg-primary-container p-6 text-on-primary-container">
        <p className="type-label-large">Total</p>
        <p className="type-display-small mt-1 font-medium tabular-nums">{formatCurrency(breakdown.total, currency)}</p>

        <dl className="type-body-medium mt-6 grid gap-3">
          <div>
            <dt className="opacity-80">Cliente</dt>
            <dd className="type-title-medium">{order.customerName}</dd>
          </div>
          <div>
            <dt className="opacity-80">Creada</dt>
            <dd className="type-title-medium">{formatDateTime(order.createdAt)}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          <Chip icon="scale" label={formatWeight(shipment.weightKg)} />
          <Chip icon={CUSTOMER_TYPE_ICONS[shipment.customerType]} label={CUSTOMER_TYPE_LABELS[shipment.customerType]} />
          <Chip icon={SHIPPING_TYPE_ICONS[shipment.shippingType]} label={SHIPPING_TYPE_LABELS[shipment.shippingType]} />
        </div>
      </div>

      <section aria-labelledby="order-breakdown-title" className="rounded-xl bg-surface-container-low px-5 py-3">
        <h2 id="order-breakdown-title" className="type-title-small pt-2 text-on-surface-variant">
          Desglose de la tarifa
        </h2>
        <PriceBreakdownList shipment={shipment} breakdown={breakdown} currency={currency} />
      </section>
    </div>
  );
}
