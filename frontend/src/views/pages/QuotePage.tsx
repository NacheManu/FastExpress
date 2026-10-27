import { useRef } from 'react';
import { useNavigate } from 'react-router';
import { useSnackbar } from '../../core/feedback/SnackbarContext';
import { useInView } from '../../core/hooks/useInView';
import { formatOrderNumber } from '../../models/order';
import { useCreateOrderViewModel } from '../../viewmodels/useCreateOrderViewModel';
import { useQuoteViewModel } from '../../viewmodels/useQuoteViewModel';
import { CreateOrderPanel } from '../components/CreateOrderPanel';
import { PageHeader } from '../components/PageHeader';
import { PricingRulesCard } from '../components/PricingRulesCard';
import { QuoteSummary } from '../components/QuoteSummary';
import { QuoteTotalBar } from '../components/QuoteTotalBar';
import { ShipmentForm } from '../components/ShipmentForm';

export function QuotePage() {
  const quoteVm = useQuoteViewModel();
  const orderVm = useCreateOrderViewModel();
  const showSnackbar = useSnackbar();
  const navigate = useNavigate();
  const summaryRef = useRef<HTMLElement>(null);
  // Se descuenta la barra de navegación inferior (80px) más un margen.
  const summaryInView = useInView(summaryRef, '0px 0px -120px 0px');

  const createOrder = async () => {
    if (!quoteVm.quote) {
      return;
    }
    const order = await orderVm.submit(quoteVm.quote.shipment);
    if (order) {
      quoteVm.reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showSnackbar({
        message: `Orden ${formatOrderNumber(order.id)} creada para ${order.customerName}.`,
        action: { label: 'Ver orden', onClick: () => navigate(`/ordenes/${order.id}`) },
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Cotizar envío"
        description="Calcula la tarifa de un envío según su peso, el tipo de cliente y el tipo de envío."
      />

      <div className="grid gap-6 expanded:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] expanded:items-start">
        <div className="flex flex-col gap-6">
          <ShipmentForm
            form={quoteVm.form}
            rules={quoteVm.rules}
            weightError={quoteVm.weightError}
            onWeightChange={quoteVm.setWeight}
            onCustomerTypeChange={quoteVm.setCustomerType}
            onShippingTypeChange={quoteVm.setShippingType}
            onReset={quoteVm.reset}
          />
          <PricingRulesCard rules={quoteVm.rules} failed={quoteVm.rulesFailed} />
        </div>

        <QuoteSummary
          ref={summaryRef}
          quote={quoteVm.quote}
          isQuoting={quoteVm.isQuoting}
          rejection={quoteVm.rejection}
          error={quoteVm.error}
          onRetry={quoteVm.retry}
          className="expanded:sticky expanded:top-20"
        >
          <CreateOrderPanel
            customerName={orderVm.customerName}
            nameError={orderVm.nameError}
            submitError={orderVm.submitError}
            isSubmitting={orderVm.isSubmitting}
            disabled={quoteVm.isQuoting}
            onCustomerNameChange={orderVm.setCustomerName}
            onSubmit={createOrder}
          />
        </QuoteSummary>
      </div>

      {quoteVm.quote && !summaryInView && (
        <QuoteTotalBar
          quote={quoteVm.quote}
          onShowDetails={() => summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />
      )}
    </>
  );
}
