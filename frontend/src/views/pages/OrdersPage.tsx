import { Link } from 'react-router';
import { Button, buttonClasses } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { LinearProgress } from '../../ui/LinearProgress';
import { TextField } from '../../ui/TextField';
import { useOrdersViewModel } from '../../viewmodels/useOrdersViewModel';
import { OrderListItem } from '../components/OrderListItem';
import { OrderStats } from '../components/OrderStats';
import { PageHeader } from '../components/PageHeader';

export function OrdersPage() {
  const vm = useOrdersViewModel();

  const newOrderLink = (
    <Link to="/" className={buttonClasses('filled', true)}>
      <Icon name="add" size={18} />
      Nueva orden
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Órdenes"
        description="Historial de órdenes de envío registradas."
        actions={vm.hasOrders ? newOrderLink : undefined}
      />

      {vm.status === 'loading' && (
        <div className="rounded-xl bg-surface-container-low p-6">
          <LinearProgress label="Cargando órdenes" />
        </div>
      )}

      {vm.status === 'error' && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-xl bg-error-container px-6 py-10 text-center text-on-error-container">
          <Icon name="cloud_off" size={32} />
          <p className="type-title-medium">No se pudieron cargar las órdenes</p>
          <p className="type-body-medium">{vm.error}</p>
          <Button icon="refresh" onClick={vm.retry} className="mt-2">
            Reintentar
          </Button>
        </div>
      )}

      {vm.status === 'ready' && !vm.hasOrders && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline-variant px-6 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icon name="inventory_2" size={32} />
          </span>
          <p className="type-title-medium">Aún no hay órdenes</p>
          <p className="type-body-medium max-w-sm text-on-surface-variant">
            Cotiza un envío y crea la orden desde el resumen de la tarifa.
          </p>
          <div className="mt-2">{newOrderLink}</div>
        </div>
      )}

      {vm.status === 'ready' && vm.hasOrders && (
        <div className="flex flex-col gap-6">
          <OrderStats {...vm.stats} />

          <section aria-labelledby="orders-list-title" className="overflow-hidden rounded-xl bg-surface-container-low">
            <div className="flex flex-col gap-3 p-4 medium:flex-row medium:items-center medium:justify-between">
              <h2 id="orders-list-title" className="type-title-large px-1">
                Historial
              </h2>
              <TextField
                label="Buscar por cliente o número"
                leadingIcon="search"
                type="search"
                value={vm.query}
                onChange={(event) => vm.setQuery(event.target.value)}
                className="medium:w-80"
              />
            </div>

            {vm.orders.length > 0 ? (
              <ul className="divide-y divide-outline-variant border-t border-outline-variant">
                {vm.orders.map((order) => (
                  <OrderListItem key={order.id} order={order} />
                ))}
              </ul>
            ) : (
              <p className="type-body-large border-t border-outline-variant px-5 py-10 text-center text-on-surface-variant">
                Ninguna orden coincide con “{vm.query}”.
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
