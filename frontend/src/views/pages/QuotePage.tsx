import { useRef } from 'react';
import { useInView } from '../../core/hooks/useInView';
import { useQuoteViewModel } from '../../viewmodels/useQuoteViewModel';
import { PageHeader } from '../components/PageHeader';
import { PricingRulesCard } from '../components/PricingRulesCard';
import { QuoteSummary } from '../components/QuoteSummary';
import { QuoteTotalBar } from '../components/QuoteTotalBar';
import { ShipmentForm } from '../components/ShipmentForm';

export function QuotePage() {
  const vm = useQuoteViewModel();
  const summaryRef = useRef<HTMLElement>(null);
  // Se descuenta la barra de navegación inferior (80px) más un margen.
  const summaryInView = useInView(summaryRef, '0px 0px -120px 0px');

  return (
    <>
      <PageHeader
        title="Cotizar envío"
        description="Calcula la tarifa de un envío según su peso, el tipo de cliente y el tipo de envío."
      />

      <div className="grid gap-6 expanded:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] expanded:items-start">
        <div className="flex flex-col gap-6">
          <ShipmentForm
            form={vm.form}
            rules={vm.rules}
            weightError={vm.weightError}
            onWeightChange={vm.setWeight}
            onCustomerTypeChange={vm.setCustomerType}
            onShippingTypeChange={vm.setShippingType}
            onReset={vm.reset}
          />
          <PricingRulesCard rules={vm.rules} failed={vm.rulesFailed} />
        </div>

        <QuoteSummary
          ref={summaryRef}
          quote={vm.quote}
          isQuoting={vm.isQuoting}
          rejection={vm.rejection}
          error={vm.error}
          onRetry={vm.retry}
          className="expanded:sticky expanded:top-20"
        />
      </div>

      {vm.quote && !summaryInView && (
        <QuoteTotalBar
          quote={vm.quote}
          onShowDetails={() => summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />
      )}
    </>
  );
}
